import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { calculateElo } from '../utils/elo';
import type { Joke } from '../types';
import { FaCheck, FaTimes, FaForward } from 'react-icons/fa';

export default function ELORanking() {
  const [joke1, setJoke1] = useState<Joke | null>(null);
  const [joke2, setJoke2] = useState<Joke | null>(null);
  const [elo1, setElo1] = useState<number>(1500);
  const [elo2, setElo2] = useState<number>(1500);
  const [showElo, setShowElo] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchRandomJokes = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      // Fetch all official jokes for better randomness
      const { data: jokes, error } = await supabase
        .from('jokes')
        .select('*')
        .eq('is_official', true);

      if (error) throw error;

      if (!jokes || jokes.length < 2) {
        setMessage('Not enough jokes in database. Please add more jokes first.');
        setLoading(false);
        return;
      }

      // Get two completely random jokes with equal probability
      // Use crypto.getRandomValues for better randomness if available, otherwise Math.random
      const getRandomIndex = (max: number): number => {
        if (max <= 0) return 0;
        // Use crypto API for better randomness if available
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
          const array = new Uint32Array(1);
          crypto.getRandomValues(array);
          return array[0] % max;
        }
        return Math.floor(Math.random() * max);
      };
      
      // Ensure we get two different jokes
      let index1 = getRandomIndex(jokes.length);
      let index2 = getRandomIndex(jokes.length);
      
      // If same index, pick a different one
      if (index1 === index2 && jokes.length > 1) {
        index2 = (index1 + 1) % jokes.length; // Simple wrap-around to ensure different
        // But also add some randomness
        const offset = getRandomIndex(jokes.length - 1) + 1;
        index2 = (index1 + offset) % jokes.length;
      }
      
      const selected1 = jokes[index1];
      const selected2 = jokes[index2];

      setJoke1(selected1);
      setJoke2(selected2);
      setShowElo(false); // Hide ELO until user votes

      // Fetch ELO ratings (but don't show them yet)
      const { data: eloData1 } = await supabase
        .from('elo_ratings')
        .select('elo_score')
        .eq('joke_id', selected1.id)
        .single();

      const { data: eloData2 } = await supabase
        .from('elo_ratings')
        .select('elo_score')
        .eq('joke_id', selected2.id)
        .single();

      setElo1(eloData1?.elo_score || 1500);
      setElo2(eloData2?.elo_score || 1500);
    } catch (error) {
      console.error('Error fetching jokes:', error);
      setMessage('Error loading jokes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomJokes();
  }, []);

  const updateElo = async (winnerId: string, loserId: string) => {
    try {
      const winnerElo = winnerId === joke1?.id ? elo1 : elo2;
      const loserElo = winnerId === joke1?.id ? elo2 : elo1;

      const { newWinnerElo, newLoserElo } = calculateElo(winnerElo, loserElo);

      // Update local ELO scores and show them
      if (winnerId === joke1?.id) {
        setElo1(newWinnerElo);
        setElo2(newLoserElo);
      } else {
        setElo1(newLoserElo);
        setElo2(newWinnerElo);
      }
      
      setShowElo(true); // Show ELO after voting

      // Upsert ELO ratings
      await supabase.from('elo_ratings').upsert({
        joke_id: winnerId,
        elo_score: newWinnerElo,
        updated_at: new Date().toISOString(),
      });

      await supabase.from('elo_ratings').upsert({
        joke_id: loserId,
        elo_score: newLoserElo,
        updated_at: new Date().toISOString(),
      });

      setMessage('Rating updated! Loading next comparison...');
      setTimeout(() => {
        fetchRandomJokes();
      }, 500); // Quick transition
    } catch (error) {
      console.error('Error updating ELO:', error);
      setMessage('Error updating rating. Please try again.');
    }
  };

  const handleChoice = (winnerId: string) => {
    if (!joke1 || !joke2) return;
    const loserId = winnerId === joke1.id ? joke2.id : joke1.id;
    updateElo(winnerId, loserId);
  };

  const handleNotAllowed = () => {
    setMessage('You can only rank jokes you experienced. Loading next comparison...');
    setTimeout(() => {
      fetchRandomJokes();
    }, 500);
  };

  if (loading && !joke1 && !joke2) {
    return (
      <div className="elo-ranking">
        <h2>ELO Ranking</h2>
        <p>Loading jokes...</p>
      </div>
    );
  }

  if (!joke1 || !joke2) {
    return (
      <div className="elo-ranking">
        <h2>ELO Ranking</h2>
        <p>Not enough jokes available. Please add jokes first.</p>
      </div>
    );
  }

  return (
    <div className="elo-ranking">
      <h2>ELO Ranking</h2>
      <p className="rules">
        <strong>Rule:</strong> You can only rank jokes you experienced or know about.
      </p>
      <p className="description">
        Compare two random jokes and pick your favorite. Your choices will update the ELO rankings.
      </p>
      
      {message && <p className="message">{message}</p>}

      <div className="comparison-container">
        <div className="joke-card">
          <div className="joke-text">{joke1.text}</div>
          {showElo && (
            <div className="elo-score">ELO: {elo1}</div>
          )}
          {!showElo && (
            <div className="elo-score-placeholder">ELO: ???</div>
          )}
          <button 
            onClick={() => handleChoice(joke1.id)}
            className="choose-btn"
            disabled={loading || showElo}
          >
            <FaCheck /> Choose This One
          </button>
        </div>

        <div className="vs">VS</div>

        <div className="joke-card">
          <div className="joke-text">{joke2.text}</div>
          {showElo && (
            <div className="elo-score">ELO: {elo2}</div>
          )}
          {!showElo && (
            <div className="elo-score-placeholder">ELO: ???</div>
          )}
          <button 
            onClick={() => handleChoice(joke2.id)}
            className="choose-btn"
            disabled={loading || showElo}
          >
            <FaCheck /> Choose This One
          </button>
        </div>
      </div>

      <button 
        onClick={handleNotAllowed}
        className="not-allowed-btn"
        disabled={loading || showElo}
      >
        <FaTimes /> Not Allowed to Rank (Didn't Experience)
      </button>

      <button 
        onClick={fetchRandomJokes}
        className="skip-btn"
        disabled={loading || showElo}
      >
        <FaForward /> Skip This Comparison
      </button>
    </div>
  );
}

