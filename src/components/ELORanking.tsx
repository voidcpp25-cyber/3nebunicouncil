import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { calculateElo } from '../utils/elo';
import type { Joke } from '../types';
import { FaCheck, FaTimes, FaForward } from 'react-icons/fa';

export default function ELORanking() {
  const [jokes, setJokes] = useState<Joke[]>([]);
  const [joke1, setJoke1] = useState<Joke | null>(null);
  const [joke2, setJoke2] = useState<Joke | null>(null);

  const [elo1, setElo1] = useState(1500);
  const [elo2, setElo2] = useState(1500);

  const [showElo, setShowElo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // ------------------------------
  // Fetch all jokes ONCE
  // ------------------------------
  const loadAllJokes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('jokes')
      .select('*')
      .eq('is_official', true);

    if (error) {
      console.error(error);
      setMessage("Couldn't load jokes.");
      setLoading(false);
      return;
    }

    setJokes(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadAllJokes();
  }, []);

  // ------------------------------
  // Given joke IDs → fetch their ELO
  // ------------------------------
  const fetchElo = async (jokeId: string) => {
    const { data } = await supabase
      .from('elo_ratings')
      .select('elo_score')
      .eq('joke_id', jokeId)
      .maybeSingle();

    return data?.elo_score ?? 1500;
  };

  // ------------------------------
  // Pick two unique random jokes
  // ------------------------------
  const selectRandomPair = async () => {
    if (jokes.length < 2) {
      setMessage('Not enough jokes to rank.');
      return;
    }

    setShowElo(false);
    setMessage('');
    setLoading(true);

    let j1 = jokes[Math.floor(Math.random() * jokes.length)];
    let j2 = jokes[Math.floor(Math.random() * jokes.length)];

    while (j1.id === j2.id) {
      j2 = jokes[Math.floor(Math.random() * jokes.length)];
    }

    const e1 = await fetchElo(j1.id);
    const e2 = await fetchElo(j2.id);

    setJoke1(j1);
    setJoke2(j2);
    setElo1(e1);
    setElo2(e2);

    setLoading(false);
  };

  // Load first pair when jokes list loads
  useEffect(() => {
    if (jokes.length >= 2) selectRandomPair();
  }, [jokes]);

  // ------------------------------
  // Perform the ELO calculation + DB update
  // ------------------------------
  const submitVote = async (winnerId: string) => {
    if (!joke1 || !joke2) return;

    setLoading(true);

    const isJ1Winner = winnerId === joke1.id;

    const winnerElo = isJ1Winner ? elo1 : elo2;
    const loserElo = isJ1Winner ? elo2 : elo1;

    const { newWinnerElo, newLoserElo } = calculateElo(winnerElo, loserElo);

    // Update local display
    if (isJ1Winner) {
      setElo1(newWinnerElo);
      setElo2(newLoserElo);
    } else {
      setElo1(newLoserElo);
      setElo2(newWinnerElo);
    }

    setShowElo(true);

    // Update in database
    await supabase.from('elo_ratings').upsert({
      joke_id: isJ1Winner ? joke1.id : joke2.id,
      elo_score: newWinnerElo,
      updated_at: new Date().toISOString()
    });

    await supabase.from('elo_ratings').upsert({
      joke_id: isJ1Winner ? joke2.id : joke1.id,
      elo_score: newLoserElo,
      updated_at: new Date().toISOString()
    });

    setMessage('Updated! Loading next pair...');

    setTimeout(() => selectRandomPair(), 600);
  };

  const skipOrNotAllowed = async () => {
    setMessage('');
    selectRandomPair();
  };

  // ------------------------------
  // UI
  // ------------------------------
  if (!joke1 || !joke2) {
    return <p>Loading...</p>;
  }

  return (
    <div className="elo-ranking">
      <h2>ELO Ranking</h2>

      {message && <p className="message">{message}</p>}

      <div className="comparison-container">
        {/* Joke 1 */}
        <div className="joke-card">
          <div className="joke-text">{joke1.text}</div>

          {showElo ? (
            <div className="elo-score">ELO: {elo1}</div>
          ) : (
            <div className="elo-score-placeholder">ELO: ???</div>
          )}

          <button
            disabled={loading || showElo}
            onClick={() => submitVote(joke1.id)}
            className="choose-btn"
          >
            <FaCheck /> Choose
          </button>
        </div>

        <div className="vs">VS</div>

        {/* Joke 2 */}
        <div className="joke-card">
          <div className="joke-text">{joke2.text}</div>

          {showElo ? (
            <div className="elo-score">ELO: {elo2}</div>
          ) : (
            <div className="elo-score-placeholder">ELO: ???</div>
          )}

          <button
            disabled={loading || showElo}
            onClick={() => submitVote(joke2.id)}
            className="choose-btn"
          >
            <FaCheck /> Choose
          </button>
        </div>
      </div>

      <button
        className="not-allowed-btn"
        disabled={loading || showElo}
        onClick={skipOrNotAllowed}
      >
        <FaTimes /> Not Allowed
      </button>

      <button
        className="skip-btn"
        disabled={loading || showElo}
        onClick={skipOrNotAllowed}
      >
        <FaForward /> Skip
      </button>
    </div>
  );
}
