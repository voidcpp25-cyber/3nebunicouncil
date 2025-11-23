import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import type { Joke, DetailedRating } from '../types';
import EditRating from './EditRating';

import {
  FaSync, FaEdit, FaLaugh, FaTrophy, FaStar, FaGem, FaBirthdayCake,
  FaStarHalfAlt, FaChartBar, FaMedal
} from 'react-icons/fa';

interface JokeWithRatings extends Joke {
  elo_score?: number;
  avg_funniness?: number;
  avg_relevance?: number;
  avg_iconicness?: number;
  avg_how_lost?: number;
  avg_quality?: number;
  avg_oldness?: number;
  avg_overall_quality?: number;
  avg_overall_score?: number;
  rating_count?: number;
}

type SortOption =
  | 'none'
  | 'elo'
  | 'overall_score'
  | 'funniness'
  | 'relevance'
  | 'iconicness'
  | 'quality'
  | 'oldness'
  | 'overall_quality';

export default function JokeList() {
  const [allJokes, setAllJokes] = useState<JokeWithRatings[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [editingJoke, setEditingJoke] = useState<Joke | null>(null);

  useEffect(() => {
    fetchJokes();
  }, []);

  async function fetchJokes() {
    setLoading(true);

    try {
      const { data: jokesData, error: jokesError } = await supabase
        .from('jokes')
        .select('*')
        .eq('is_official', true)
        .order('created_at', { ascending: false });

      if (jokesError) throw jokesError;

      const { data: eloData } = await supabase
        .from('elo_ratings')
        .select('joke_id, elo_score');

      const { data: detailedRatings } = await supabase
        .from('detailed_ratings')
        .select('*');

      const eloMap = new Map<string, number>();
      eloData?.forEach(r => eloMap.set(r.joke_id, r.elo_score));

      const ratingsMap = new Map<string, DetailedRating[]>();
      detailedRatings?.forEach(r => {
        if (!ratingsMap.has(r.joke_id)) ratingsMap.set(r.joke_id, []);
        ratingsMap.get(r.joke_id)!.push(r);
      });

      const combined = jokesData!.map(joke => {
        const list = ratingsMap.get(joke.id) ?? [];
        const avg = (key: keyof DetailedRating) => {
          if (list.length === 0) return undefined;
        
          const sum = list.reduce((s, r: DetailedRating) => {
            const value = r[key] ?? 0;
        
            // ensure number (TS sometimes thinks it could be undefined)
            return s + Number(value);
          }, 0);
        
          return sum / list.length;
        };
        
        return {
          ...joke,
          elo_score: eloMap.get(joke.id),
          avg_funniness: avg('funniness'),
          avg_relevance: avg('relevance'),
          avg_iconicness: avg('iconicness'),
          avg_how_lost: avg('how_lost'),
          avg_quality: avg('quality'),
          avg_oldness: avg('oldness'),
          avg_overall_quality: avg('overall_quality'),
          avg_overall_score: avg('overall_score'),
          rating_count: list.length
        };
      });

      setAllJokes(combined);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  const sortedAllJokes = useMemo(() => {
    const arr = [...allJokes];

    const direction = sortDir === 'asc' ? 1 : -1;

    if (sortBy === 'none') {
      return arr.sort((a, b) =>
        direction === 1
          ? new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
          : new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
    }

    const getValue = (j: JokeWithRatings) => {
      switch (sortBy) {
        case 'elo': return j.elo_score ?? 0;
        case 'overall_score': return j.avg_overall_score ?? 0;
        case 'funniness': return j.avg_funniness ?? 0;
        case 'relevance': return j.avg_relevance ?? 0;
        case 'iconicness': return j.avg_iconicness ?? 0;
        case 'quality': return j.avg_quality ?? 0;
        case 'oldness': return j.avg_oldness ?? 0;
        case 'overall_quality': return j.avg_overall_quality ?? 0;
        default: return 0;
      }
    };

    return arr.sort((a, b) =>
      direction === 1 ? getValue(a) - getValue(b) : getValue(b) - getValue(a)
    );
  }, [sortBy, sortDir, allJokes]);

  const rankMap = useMemo(() => {
    const map = new Map<string, number>();
    sortedAllJokes.forEach((j, idx) => map.set(j.id, idx + 1));
    return map;
  }, [sortedAllJokes]);

  const filteredJokes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sortedAllJokes;
    const terms = q.split(/\s+/).filter(Boolean);
    return sortedAllJokes.filter(j => {
      const text = j.text.toLowerCase();
      return terms.some(t => text.includes(t));
    });
  }, [searchQuery, sortedAllJokes]);

  const format = (v?: number) => v === undefined ? 'N/A' : v.toFixed(1);
  if (loading) return <p>Loading jokes...</p>;

  return (
    <div className="joke-list">
      <div className="list-header">
        <h2>Inside Jokes List</h2>

        <div className="header-controls">
          <input
            className="search-input"
            placeholder="Search jokes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />

          <button onClick={fetchJokes} className="refresh-btn">
            <FaSync /> Refresh
          </button>

          <select
            className="sort-select"
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
          >
            <option value="none">Newest First</option>
            <option value="elo">ELO Ranking</option>
            <option value="overall_score">Overall Score</option>
            <option value="funniness">Funniness</option>
            <option value="relevance">Relevance</option>
            <option value="iconicness">Iconicness</option>
            <option value="quality">Quality</option>
            <option value="oldness">Oldness</option>
            <option value="overall_quality">Overall Quality</option>
          </select>

          <button
            className="sort-dir-btn"
            onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
          >
            {sortDir === 'asc' ? 'Asc' : 'Desc'}
          </button>

        </div>
      </div>

      <div className="jokes-grid">
        {filteredJokes.map((joke) => {
          const rank = rankMap.get(joke.id) ?? '-';
          return (
            <div key={joke.id} className="joke-card-list">
              <div className="joke-rank">#{rank}</div>

              <div className="joke-content">
                <h3>{joke.text}</h3>

                <div className="joke-stats">
                  {joke.elo_score !== undefined && (
                    <div className="stat-item"><FaMedal /> {joke.elo_score}</div>
                  )}

                  {joke.avg_overall_score !== undefined && (
                    <div className="stat-item"><FaChartBar /> {format(joke.avg_overall_score)}</div>
                  )}

                  {joke.avg_funniness !== undefined && (
                    <div className="stat-item"><FaLaugh /> {format(joke.avg_funniness)}</div>
                  )}

                  {joke.avg_relevance !== undefined && (
                    <div className="stat-item"><FaTrophy /> {format(joke.avg_relevance)}</div>
                  )}

                  {joke.avg_iconicness !== undefined && (
                    <div className="stat-item"><FaStar /> {format(joke.avg_iconicness)}</div>
                  )}

                  {joke.avg_quality !== undefined && (
                    <div className="stat-item"><FaGem /> {format(joke.avg_quality)}</div>
                  )}

                  {joke.avg_oldness !== undefined && (
                    <div className="stat-item"><FaBirthdayCake /> {format(joke.avg_oldness)}</div>
                  )}

                  {joke.avg_overall_quality !== undefined && (
                    <div className="stat-item"><FaStarHalfAlt /> {format(joke.avg_overall_quality)}</div>
                  )}

                </div>

                <button
                  onClick={() => setEditingJoke(joke)}
                  className="edit-rating-btn"
                >
                  <FaEdit /> Edit Rating
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {editingJoke && (
        <EditRating
          joke={editingJoke}
          onClose={() => setEditingJoke(null)}
          onUpdate={() => {
            fetchJokes();
            setEditingJoke(null);
          }}
        />
      )}
    </div>
  );
}

