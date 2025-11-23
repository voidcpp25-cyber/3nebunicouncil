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

  // -------------------------------
  // Load all jokes once
  // -------------------------------
  const loadAllJokes = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('jokes')
      .select('*')
      .eq('is_official', true);

    if (error) {
      console.error(error);
      setMessage('Error loading jokes.');
      setLoading(false);
      return;
    }

    setJokes(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadAllJokes();
  }, []);

  // -------------------------------
  // Fetch elo for joke
  // -------------------------------
  const fetchElo = async (jokeId: string) => {
    const { data, error } = await supabase
      .from('elo_ratings')
      .select('elo_score')
      .eq('joke_id', jokeId)
      .maybeSingle();

    if (error) console.error(error);

    return data?.elo_score ?? 1500;
  };

  // -------------------------------
  // Pick two unique random jokes
  // -------------------------------
  const loadNewPair = async () => {
    if (jokes.length < 2) {
      setMessage('Not enough jokes to compare.');
      return;
    }

    setLoading(true);
    setShowElo(false);
    setMessage('');

    let one = jokes[Math.floor(Math.random() * jokes.length)];
    let two = jokes[Math.floor(Math.random() * jokes.length)];

    while (one.id === two.id) {
      two = jokes[Math.floor(Math.random() * jokes.length)];
    }

    const e1 = await fetchElo(one.id);
    const e2 = await fetchElo(two.id);

    setJoke1(one);
    setJoke2(two);
    setElo1(e1);
    setElo2(e2);

    setLoading(false);
  };

  useEffect(() => {
    if (jokes.length >= 2) loadNewPair();
  }, [jokes]);

  // -------------------------------
  // Update ELO in database
  // -------------------------------
  const updateElo = async (winnerId: string) => {
    if (!joke1 || !joke2) return;

    setLoading(true);

    const isWinnerJ1 = winnerId === joke1.id;
    const winnerElo = isWinnerJ1 ? elo1 : elo2;
    const loserElo = isWinnerJ1 ? elo2 : elo1;

    const { newWinnerElo, newLoserElo } = calculateElo(winnerElo, loserElo);

    // Update UI immediately
    if (isWinnerJ1) {
      setElo1(newWinnerElo);
      setElo2(newLoserElo);
    } else {
      setElo1(newLoserElo);
      setElo2(newWinnerElo);
    }

    setShowElo(true);

    // Update DB (IMPORTANT: onConflict ensures UPDATE not INSERT)
    const { error: wErr } = await supabase
      .from('elo_ratings')
      .upsert(
        {
          joke_id: winnerId,
          elo_score: newWinnerElo,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'joke_id' }
      );

    if (wErr) console.error('Winner ELO update failed:', wErr);

    const loserId = isWinnerJ1 ? joke2.id : joke1.id;

    const { error: lErr } = await supabase
      .from('elo_ratings')
      .upsert(
        {
          joke_id: loserId,
          elo_score: newLoserElo,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'joke_id' }
      );

    if (lErr) console.error('Loser ELO update failed:', lErr);

    setMessage('Updated! Loading next pair...');

    setTimeout(() => {
      loadNewPair();
    }, 700);
  };

  // -------------------------------
  // Button actions
  // -------------------------------
  const handleNotAllowed = () => {
    setMessage('');
    loadNewPair();
  };

  if (!joke1 || !joke2) return <p>Loading...</p>;

  return (
    <div className="elo-ranking">
      <h2>ELO Ranking</h2>

      {message && <p className="message">{message}</p>}

      <div className="comparison-container">
        {/* Joke 1 */}
        <div className="joke-card">
          <div className="joke-text">{joke1.text}</div>

          {showElo ? <div className="elo-score">ELO: {elo1}</div> : <div className="elo-score-placeholder">ELO: ???</div>}

          <button
            className="choose-btn"
            disabled={loading || showElo}
            onClick={() => updateElo(joke1.id)}
          >
            <FaCheck /> Choose
          </button>
        </div>

        <div className="vs">VS</div>

        {/* Joke 2 */}
        <div className="joke-card">
          <div className="joke-text">{joke2.text}</div>

          {showElo ? <div className="elo-score">ELO: {elo2}</div> : <div className="elo-score-placeholder">ELO: ???</div>}

          <button
            className="choose-btn"
            disabled={loading || showElo}
            onClick={() => updateElo(joke2.id)}
          >
            <FaCheck /> Choose
          </button>
        </div>
      </div>

      <button
        className="not-allowed-btn"
        disabled={loading || showElo}
        onClick={handleNotAllowed}
      >
        <FaTimes /> Not Allowed
      </button>

      <button
        className="skip-btn"
        disabled={loading || showElo}
        onClick={handleNotAllowed}
      >
        <FaForward /> Skip
      </button>
    </div>
  );
}
