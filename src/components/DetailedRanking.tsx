import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Joke } from '../types';
import { 
  FaLaugh, 
  FaTrophy, 
  FaStar, 
  FaCalendarAlt, 
  FaGem, 
  FaBirthdayCake, 
  FaSearch, 
  FaStarHalfAlt,
  FaCheck,
  FaTimes,
  FaForward
} from 'react-icons/fa';

export default function DetailedRanking() {
  const [currentJoke, setCurrentJoke] = useState<Joke | null>(null);
  const [existingRatingId, setExistingRatingId] = useState<string | null>(null);
  const [ratings, setRatings] = useState({
    funniness: 5.0,
    relevance: 5.0,
    iconicness: 5.0,
    how_lost: 5.0,
    quality: 5.0,
    oldness: 5.0,
    decipherability: 5.0,
    overall_quality: 5.0,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchRandomJoke = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const { data: jokes, error } = await supabase
        .from('jokes')
        .select('*')
        .eq('is_official', true)
        .limit(100);

      if (error) throw error;

      if (!jokes || jokes.length === 0) {
        setMessage('No jokes in database. Please add jokes first.');
        setLoading(false);
        return;
      }

      const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
      setCurrentJoke(randomJoke);
      
      // Check if this joke has been rated (using localStorage)
      const ratedJokes = JSON.parse(localStorage.getItem('rated_jokes') || '{}');
      const ratingId = ratedJokes[randomJoke.id];
      
      if (ratingId) {
        // Fetch existing rating
        const { data: existingRating } = await supabase
          .from('detailed_ratings')
          .select('*')
          .eq('id', ratingId)
          .single();
        
        if (existingRating) {
          setExistingRatingId(existingRating.id);
          setRatings({
            funniness: Number(existingRating.funniness),
            relevance: Number(existingRating.relevance),
            iconicness: Number(existingRating.iconicness),
            how_lost: Number(existingRating.how_lost),
            quality: Number(existingRating.quality),
            oldness: Number(existingRating.oldness),
            decipherability: Number(existingRating.decipherability),
            overall_quality: Number(existingRating.overall_quality),
          });
        } else {
          // Rating was deleted, reset
          setExistingRatingId(null);
          setRatings({
            funniness: 5.0,
            relevance: 5.0,
            iconicness: 5.0,
            how_lost: 5.0,
            quality: 5.0,
            oldness: 5.0,
            decipherability: 5.0,
            overall_quality: 5.0,
          });
        }
      } else {
        // No existing rating
        setExistingRatingId(null);
        setRatings({
          funniness: 5.0,
          relevance: 5.0,
          iconicness: 5.0,
          how_lost: 5.0,
          quality: 5.0,
          oldness: 5.0,
          decipherability: 5.0,
          overall_quality: 5.0,
        });
      }
    } catch (error) {
      console.error('Error fetching joke:', error);
      setMessage('Error loading joke. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomJoke();
  }, []);

  const calculateOverall = () => {
    const clampNeutral = (v: number) => Math.min(10, Math.max(5, v)); // floor at 5 so memory-style metrics never penalize
    const { funniness, relevance, iconicness, quality, oldness, how_lost } = ratings;

    const score =
      0.35 * funniness +
      0.20 * relevance +
      0.15 * iconicness +
      0.15 * quality +
      0.05 * clampNeutral(oldness) +
      0.10 * clampNeutral(how_lost);

    return Number(score.toFixed(2));
  };

  const handleSubmit = async () => {
    if (!currentJoke) return;

    setLoading(true);
    setMessage('');

    const overallScore = calculateOverall();
    
    // Ensure all values are properly formatted as decimals
    const ratingData: any = {
      joke_id: currentJoke.id,
      funniness: parseFloat(ratings.funniness.toFixed(1)),
      relevance: parseFloat(ratings.relevance.toFixed(1)),
      iconicness: parseFloat(ratings.iconicness.toFixed(1)),
      how_lost: parseFloat(ratings.how_lost.toFixed(1)),
      quality: parseFloat(ratings.quality.toFixed(1)),
      oldness: parseFloat(ratings.oldness.toFixed(1)),
      decipherability: parseFloat(ratings.decipherability.toFixed(1)),
      overall_quality: parseFloat(ratings.overall_quality.toFixed(1)),
      overall_score: parseFloat(overallScore.toFixed(2)),
    };

    try {
      let ratingId: string;
      
      if (existingRatingId) {
        // Update existing rating - include updated_at
        ratingData.updated_at = new Date().toISOString();
        const { error } = await supabase
          .from('detailed_ratings')
          .update(ratingData)
          .eq('id', existingRatingId);

        if (error) {
          console.error('Update error:', error);
          throw new Error(error.message || 'Failed to update rating');
        }
        ratingId = existingRatingId;
        setMessage('✅ Rating updated! Loading next joke...');
      } else {
        // Create new rating - don't include updated_at, let DB set defaults
        const { data, error } = await supabase
          .from('detailed_ratings')
          .insert(ratingData)
          .select()
          .single();

        if (error) {
          console.error('Insert error:', error);
          throw new Error(error.message || 'Failed to submit rating');
        }
        
        if (!data) {
          throw new Error('No data returned from insert');
        }
        
        ratingId = data.id;
        
        // Store in localStorage
        const ratedJokes = JSON.parse(localStorage.getItem('rated_jokes') || '{}');
        ratedJokes[currentJoke.id] = ratingId;
        localStorage.setItem('rated_jokes', JSON.stringify(ratedJokes));
        
        setExistingRatingId(ratingId);
        setMessage('✅ Rating submitted! Loading next joke...');
      }

      setTimeout(() => {
        fetchRandomJoke();
      }, 1000);
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      setMessage(`❌ Error: ${errorMessage}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleNotAllowed = () => {
    setMessage('You can only rank jokes you experienced. Loading next joke...');
    setTimeout(() => {
      fetchRandomJoke();
    }, 1500);
  };

  if (loading && !currentJoke) {
    return (
      <div className="detailed-ranking">
        <h2>Detailed Ranking</h2>
        <p>Loading joke...</p>
      </div>
    );
  }

  if (!currentJoke) {
    return (
      <div className="detailed-ranking">
        <h2>Detailed Ranking</h2>
        <p>No jokes available. Please add jokes first.</p>
      </div>
    );
  }

  const overallScore = calculateOverall();

  return (
    <div className="detailed-ranking">
      <h2>Detailed Ranking</h2>
      <p className="rules">
        <strong>Rule:</strong> You can only rank jokes you experienced or know about.
      </p>
      
      {message && <p className="message">{message}</p>}

      <div className="joke-display">
        <h3>{currentJoke.text}</h3>
      </div>

      <div className="ratings-container">
        <div className="rating-item">
          <label><FaLaugh /> Funniness (1-10)</label>
          <input
            type="range"
            min="1"
            max="10"
            step="0.1"
            value={ratings.funniness}
            onChange={(e) => setRatings({ ...ratings, funniness: parseFloat(e.target.value) })}
          />
          <input
            type="number"
            min="1"
            max="10"
            step="0.1"
            value={ratings.funniness}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 5.0;
              const clamped = Math.max(1, Math.min(10, val));
              setRatings({ ...ratings, funniness: clamped });
            }}
            className="rating-number-input"
          />
          <span>{ratings.funniness.toFixed(1)}</span>
        </div>

        <div className="rating-item">
          <label><FaTrophy /> Relevance (1-10)</label>
          <input
            type="range"
            min="1"
            max="10"
            step="0.1"
            value={ratings.relevance}
            onChange={(e) => setRatings({ ...ratings, relevance: parseFloat(e.target.value) })}
          />
          <input
            type="number"
            min="1"
            max="10"
            step="0.1"
            value={ratings.relevance}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 5.0;
              const clamped = Math.max(1, Math.min(10, val));
              setRatings({ ...ratings, relevance: clamped });
            }}
            className="rating-number-input"
          />
          <span>{ratings.relevance.toFixed(1)}</span>
        </div>

        <div className="rating-item">
          <label><FaStar /> Iconic-ness (1-10)</label>
          <input
            type="range"
            min="1"
            max="10"
            step="0.1"
            value={ratings.iconicness}
            onChange={(e) => setRatings({ ...ratings, iconicness: parseFloat(e.target.value) })}
          />
          <input
            type="number"
            min="1"
            max="10"
            step="0.1"
            value={ratings.iconicness}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 5.0;
              const clamped = Math.max(1, Math.min(10, val));
              setRatings({ ...ratings, iconicness: clamped });
            }}
            className="rating-number-input"
          />
          <span>{ratings.iconicness.toFixed(1)}</span>
        </div>

        <div className="rating-item">
          <label><FaCalendarAlt /> How Lost It Would Have Been (1-10)</label>
          <input
            type="range"
            min="1"
            max="10"
            step="0.1"
            value={ratings.how_lost}
            onChange={(e) => setRatings({ ...ratings, how_lost: parseFloat(e.target.value) })}
          />
          <input
            type="number"
            min="1"
            max="10"
            step="0.1"
            value={ratings.how_lost}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 5.0;
              const clamped = Math.max(1, Math.min(10, val));
              setRatings({ ...ratings, how_lost: clamped });
            }}
            className="rating-number-input"
          />
          <span>{ratings.how_lost.toFixed(1)}</span>
        </div>

        <div className="rating-item">
          <label><FaGem /> Quality (1-10)</label>
          <input
            type="range"
            min="1"
            max="10"
            step="0.1"
            value={ratings.quality}
            onChange={(e) => setRatings({ ...ratings, quality: parseFloat(e.target.value) })}
          />
          <input
            type="number"
            min="1"
            max="10"
            step="0.1"
            value={ratings.quality}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 5.0;
              const clamped = Math.max(1, Math.min(10, val));
              setRatings({ ...ratings, quality: clamped });
            }}
            className="rating-number-input"
          />
          <span>{ratings.quality.toFixed(1)}</span>
        </div>

        <div className="rating-item">
          <label><FaBirthdayCake /> Oldness (1-10)</label>
          <input
            type="range"
            min="1"
            max="10"
            step="0.1"
            value={ratings.oldness}
            onChange={(e) => setRatings({ ...ratings, oldness: parseFloat(e.target.value) })}
          />
          <input
            type="number"
            min="1"
            max="10"
            step="0.1"
            value={ratings.oldness}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 5.0;
              const clamped = Math.max(1, Math.min(10, val));
              setRatings({ ...ratings, oldness: clamped });
            }}
            className="rating-number-input"
          />
          <span>{ratings.oldness.toFixed(1)}</span>
        </div>

        <div className="rating-item">
          <label><FaSearch /> Decipherability (1-10) - Not included in overall</label>
          <input
            type="range"
            min="1"
            max="10"
            step="0.1"
            value={ratings.decipherability}
            onChange={(e) => setRatings({ ...ratings, decipherability: parseFloat(e.target.value) })}
          />
          <input
            type="number"
            min="1"
            max="10"
            step="0.1"
            value={ratings.decipherability}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 5.0;
              const clamped = Math.max(1, Math.min(10, val));
              setRatings({ ...ratings, decipherability: clamped });
            }}
            className="rating-number-input"
          />
          <span>{ratings.decipherability.toFixed(1)}</span>
        </div>

        <div className="rating-item">
          <label><FaStarHalfAlt /> Overall Quality (1-10) - Not included in overall score</label>
          <input
            type="range"
            min="1"
            max="10"
            step="0.1"
            value={ratings.overall_quality}
            onChange={(e) => setRatings({ ...ratings, overall_quality: parseFloat(e.target.value) })}
          />
          <input
            type="number"
            min="1"
            max="10"
            step="0.1"
            value={ratings.overall_quality}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 5.0;
              const clamped = Math.max(1, Math.min(10, val));
              setRatings({ ...ratings, overall_quality: clamped });
            }}
            className="rating-number-input"
          />
          <span>{ratings.overall_quality.toFixed(1)}</span>
        </div>

        <div className="overall-score">
          <strong>Overall Score: {overallScore.toFixed(1)}</strong>
          <small>(Weighted: funniness/relevance/iconicness/quality + neutralized oldness/how_lost)</small>
        </div>
      </div>

      {existingRatingId && (
        <p className="message success" style={{ marginBottom: '16px' }}>
          You've already rated this joke. You can update your rating below.
        </p>
      )}

      <div className="actions">
        <button onClick={handleSubmit} className="submit-btn" disabled={loading}>
          {existingRatingId ? <><FaCheck /> Update Rating</> : <><FaCheck /> Submit Rating</>}
        </button>
        <button onClick={handleNotAllowed} className="not-allowed-btn" disabled={loading}>
          <FaTimes /> Not Allowed to Rank (Didn't Experience)
        </button>
        <button onClick={fetchRandomJoke} className="skip-btn" disabled={loading}>
          <FaForward /> Skip This Joke
        </button>
      </div>
    </div>
  );
}

