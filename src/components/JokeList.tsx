import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Joke, DetailedRating } from '../types';
import EditRating from './EditRating';
import { 
  FaList, 
  FaTrophy, 
  FaStar, 
  FaPlus, 
  FaClock, 
  FaDownload,
  FaSync,
  FaEdit,
  FaLaugh,
  FaGem,
  FaBirthdayCake,
  FaSearch,
  FaStarHalfAlt,
  FaCalendarAlt,
  FaChartBar,
  FaMedal
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
  const [jokes, setJokes] = useState<JokeWithRatings[]>([]);
  const [allJokes, setAllJokes] = useState<JokeWithRatings[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingJoke, setEditingJoke] = useState<Joke | null>(null);

  useEffect(() => {
    fetchJokesWithRatings();
  }, []);

  const fetchJokesWithRatings = async () => {
    setLoading(true);
    try {
      // Fetch all official jokes
      const { data: jokesData, error: jokesError } = await supabase
        .from('jokes')
        .select('*')
        .eq('is_official', true)
        .order('created_at', { ascending: false });

      if (jokesError) throw jokesError;

      if (!jokesData || jokesData.length === 0) {
        setJokes([]);
        setLoading(false);
        return;
      }

      // Fetch ELO ratings
      const { data: eloData } = await supabase
        .from('elo_ratings')
        .select('joke_id, elo_score');

      // Fetch detailed ratings and calculate averages
      const { data: detailedRatings } = await supabase
        .from('detailed_ratings')
        .select('*');

      // Create maps for quick lookup
      const eloMap = new Map<string, number>();
      eloData?.forEach((rating) => {
        eloMap.set(rating.joke_id, rating.elo_score);
      });

      // Calculate averages for each joke
      const ratingsMap = new Map<string, DetailedRating[]>();
      detailedRatings?.forEach((rating) => {
        if (!ratingsMap.has(rating.joke_id)) {
          ratingsMap.set(rating.joke_id, []);
        }
        ratingsMap.get(rating.joke_id)?.push(rating);
      });

      // Combine jokes with their ratings
      const jokesWithRatings: JokeWithRatings[] = jokesData.map((joke) => {
        const jokeRatings = ratingsMap.get(joke.id) || [];
        const eloScore = eloMap.get(joke.id);

        // Calculate averages
        const avgFunniness = jokeRatings.length > 0
          ? jokeRatings.reduce((sum, r) => sum + r.funniness, 0) / jokeRatings.length
          : undefined;
        const avgRelevance = jokeRatings.length > 0
          ? jokeRatings.reduce((sum, r) => sum + r.relevance, 0) / jokeRatings.length
          : undefined;
        const avgIconicness = jokeRatings.length > 0
          ? jokeRatings.reduce((sum, r) => sum + r.iconicness, 0) / jokeRatings.length
          : undefined;
        const avgHowLost = jokeRatings.length > 0
          ? jokeRatings.reduce((sum, r) => sum + r.how_lost, 0) / jokeRatings.length
          : undefined;
        const avgQuality = jokeRatings.length > 0
          ? jokeRatings.reduce((sum, r) => sum + r.quality, 0) / jokeRatings.length
          : undefined;
        const avgOldness = jokeRatings.length > 0
          ? jokeRatings.reduce((sum, r) => sum + r.oldness, 0) / jokeRatings.length
          : undefined;
        const avgOverallQuality = jokeRatings.length > 0
          ? jokeRatings.reduce((sum, r) => sum + r.overall_quality, 0) / jokeRatings.length
          : undefined;
        const avgOverallScore = jokeRatings.length > 0
          ? jokeRatings.reduce((sum, r) => sum + r.overall_score, 0) / jokeRatings.length
          : undefined;

        return {
          ...joke,
          elo_score: eloScore,
          avg_funniness: avgFunniness,
          avg_relevance: avgRelevance,
          avg_iconicness: avgIconicness,
          avg_how_lost: avgHowLost,
          avg_quality: avgQuality,
          avg_oldness: avgOldness,
          avg_overall_quality: avgOverallQuality,
          avg_overall_score: avgOverallScore,
          rating_count: jokeRatings.length,
        };
      });

      setJokes(jokesWithRatings);
      setAllJokes(jokesWithRatings);
    } catch (error) {
      console.error('Error fetching jokes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Filter jokes based on search query
    if (searchQuery.trim() === '') {
      setJokes(allJokes);
    } else {
      const filtered = allJokes.filter(joke =>
        joke.text.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setJokes(filtered);
    }
  }, [searchQuery, allJokes]);

  const getSortedJokes = (): JokeWithRatings[] => {
    const jokesToSort = [...jokes];
    
    if (sortBy === 'none') {
      // Sort by newest first (created_at descending)
      return jokesToSort.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      });
    }

    const sorted = jokesToSort.sort((a, b) => {
      let aValue: number | undefined;
      let bValue: number | undefined;

      switch (sortBy) {
        case 'elo':
          aValue = a.elo_score ?? 0;
          bValue = b.elo_score ?? 0;
          break;
        case 'overall_score':
          aValue = a.avg_overall_score ?? 0;
          bValue = b.avg_overall_score ?? 0;
          break;
        case 'funniness':
          aValue = a.avg_funniness ?? 0;
          bValue = b.avg_funniness ?? 0;
          break;
        case 'relevance':
          aValue = a.avg_relevance ?? 0;
          bValue = b.avg_relevance ?? 0;
          break;
        case 'iconicness':
          aValue = a.avg_iconicness ?? 0;
          bValue = b.avg_iconicness ?? 0;
          break;
        case 'quality':
          aValue = a.avg_quality ?? 0;
          bValue = b.avg_quality ?? 0;
          break;
        case 'oldness':
          aValue = a.avg_oldness ?? 0;
          bValue = b.avg_oldness ?? 0;
          break;
        case 'overall_quality':
          aValue = a.avg_overall_quality ?? 0;
          bValue = b.avg_overall_quality ?? 0;
          break;
        default:
          return 0;
      }

      // Sort descending (highest first)
      return (bValue ?? 0) - (aValue ?? 0);
    });

    return sorted;
  };

  const formatRating = (value: number | undefined): string => {
    if (value === undefined) return 'N/A';
    return value.toFixed(1);
  };

  const hasRatings = (joke: JokeWithRatings): boolean => {
    // Show edit button if joke has any ratings (not just user's)
    return (joke.rating_count !== undefined && joke.rating_count > 0) || 
           joke.avg_overall_score !== undefined ||
           joke.elo_score !== undefined;
  };

  const handleEditRating = (joke: JokeWithRatings) => {
    setEditingJoke(joke);
  };

  const handleCloseEdit = () => {
    setEditingJoke(null);
  };

  const handleRatingUpdated = () => {
    fetchJokesWithRatings(); // Refresh the list after rating is updated
    setEditingJoke(null);
  };

  if (loading) {
    return (
      <div className="joke-list">
        <h2>Inside Jokes List</h2>
        <p>Loading jokes...</p>
      </div>
    );
  }

  const sortedJokes = getSortedJokes();

  return (
    <div className="joke-list">
      <div className="list-header">
        <h2>Inside Jokes List</h2>
        <div className="header-controls">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search jokes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <button 
            onClick={fetchJokesWithRatings} 
            className="refresh-btn"
            disabled={loading}
          >
            <FaSync /> Refresh
          </button>
          <div className="sort-controls">
            <label htmlFor="sort-select">Sort by:</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="sort-select"
            >
              <option value="none">Newest First</option>
              <option value="elo">ELO Ranking</option>
              <option value="overall_score">Overall Score</option>
              <option value="funniness">Funniness</option>
              <option value="relevance">Relevance</option>
              <option value="iconicness">Iconic-ness</option>
              <option value="quality">Quality</option>
              <option value="oldness">Oldness</option>
              <option value="overall_quality">Overall Quality</option>
            </select>
          </div>
        </div>
      </div>

      {sortedJokes.length === 0 ? (
        <p>No jokes in the database. Add some jokes to get started!</p>
      ) : (
        <div className="jokes-grid">
          {sortedJokes.map((joke, index) => (
            <div key={joke.id} className="joke-card-list">
              <div className="joke-rank">#{index + 1}</div>
              <div className="joke-content">
                <h3>{joke.text}</h3>
                <div className="joke-stats">
                  {joke.elo_score !== undefined && (
                    <div className="stat-item">
                      <span className="stat-label"><FaMedal /> ELO:</span>
                      <span className="stat-value">{joke.elo_score}</span>
                    </div>
                  )}
                  {joke.avg_overall_score !== undefined && (
                    <div className="stat-item">
                      <span className="stat-label"><FaChartBar /> Overall Score:</span>
                      <span className="stat-value">{formatRating(joke.avg_overall_score)}</span>
                    </div>
                  )}
                  {joke.avg_funniness !== undefined && (
                    <div className="stat-item">
                      <span className="stat-label"><FaLaugh /> Funniness:</span>
                      <span className="stat-value">{formatRating(joke.avg_funniness)}</span>
                    </div>
                  )}
                  {joke.avg_relevance !== undefined && (
                    <div className="stat-item">
                      <span className="stat-label"><FaTrophy /> Relevance:</span>
                      <span className="stat-value">{formatRating(joke.avg_relevance)}</span>
                    </div>
                  )}
                  {joke.avg_iconicness !== undefined && (
                    <div className="stat-item">
                      <span className="stat-label"><FaStar /> Iconic-ness:</span>
                      <span className="stat-value">{formatRating(joke.avg_iconicness)}</span>
                    </div>
                  )}
                  {joke.avg_quality !== undefined && (
                    <div className="stat-item">
                      <span className="stat-label"><FaGem /> Quality:</span>
                      <span className="stat-value">{formatRating(joke.avg_quality)}</span>
                    </div>
                  )}
                  {joke.avg_oldness !== undefined && (
                    <div className="stat-item">
                      <span className="stat-label"><FaBirthdayCake /> Oldness:</span>
                      <span className="stat-value">{formatRating(joke.avg_oldness)}</span>
                    </div>
                  )}
                  {joke.avg_overall_quality !== undefined && (
                    <div className="stat-item">
                      <span className="stat-label"><FaStarHalfAlt /> Overall Quality:</span>
                      <span className="stat-value">{formatRating(joke.avg_overall_quality)}</span>
                    </div>
                  )}
                  {joke.rating_count !== undefined && joke.rating_count > 0 && (
                    <div className="stat-item rating-count">
                      <span className="stat-label">Ratings:</span>
                      <span className="stat-value">{joke.rating_count}</span>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => handleEditRating(joke)}
                  className="edit-rating-btn"
                >
                  <FaEdit /> {hasRatings(joke) ? 'Edit Rating' : 'Add Rating'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingJoke && (
        <EditRating
          joke={editingJoke}
          onClose={handleCloseEdit}
          onUpdate={handleRatingUpdated}
        />
      )}
    </div>
  );
}

