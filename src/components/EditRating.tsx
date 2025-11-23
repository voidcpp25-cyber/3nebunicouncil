import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Joke } from '../types';
import { FaTimes } from 'react-icons/fa';
import { 
  FaLaugh, 
  FaTrophy, 
  FaStar, 
  FaCalendarAlt, 
  FaGem, 
  FaBirthdayCake, 
  FaSearch, 
  FaStarHalfAlt 
} from 'react-icons/fa';

interface EditRatingProps {
  joke: Joke;
  onClose: () => void;
  onUpdate: () => void;
}

export default function EditRating({ joke, onClose, onUpdate }: EditRatingProps) {
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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ratingId, setRatingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadExistingRating();
  }, [joke.id]);

  const loadExistingRating = async () => {
    try {
      setLoading(true);
      // Fetch the most recent rating for this joke (anyone's rating)
      const { data: existingRatings, error } = await supabase
        .from('detailed_ratings')
        .select('*')
        .eq('joke_id', joke.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching ratings:', error);
        // Continue with default values if error
      } else if (existingRatings && existingRatings.length > 0) {
        // Load the most recent rating
        const existingRating = existingRatings[0];
        setRatingId(existingRating.id);
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
        // No existing rating, start with defaults
        setRatingId(null);
      }
    } catch (error) {
      console.error('Error loading rating:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateOverall = () => {
    const clampNeutral = (v: number) => Math.min(10, Math.max(5, v)); // floor at 5 to avoid penalizing memory-style metrics
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
    setSubmitting(true);
    setMessage('');
    
    const overallScore = calculateOverall();
    
    // Ensure all values are properly formatted as decimals
    const ratingData: any = {
      joke_id: joke.id,
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
      if (ratingId) {
        // Update existing rating - include updated_at
        ratingData.updated_at = new Date().toISOString();
        const { error } = await supabase
          .from('detailed_ratings')
          .update(ratingData)
          .eq('id', ratingId);

        if (error) {
          console.error('Update error:', error);
          throw new Error(error.message || 'Failed to update rating');
        }
        setMessage('✅ Rating updated successfully!');
      } else {
        // Create new rating - don't include updated_at, let DB set defaults
        const { data, error } = await supabase
          .from('detailed_ratings')
          .insert(ratingData)
          .select()
          .single();

        if (error) {
          console.error('Insert error:', error);
          throw new Error(error.message || 'Failed to create rating');
        }
        
        if (!data) {
          throw new Error('No data returned from insert');
        }
        
        // Store the new rating ID for future edits
        setRatingId(data.id);
        setMessage('✅ Rating created successfully!');
      }

      // Wait a moment to show success message, then close
      setTimeout(() => {
        onUpdate();
        onClose();
      }, 1000);
    } catch (error: any) {
      console.error('Error updating rating:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      setMessage(`❌ Error: ${errorMessage}. Please try again.`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-rating-modal">
        <div className="modal-content">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const overallScore = calculateOverall();

  return (
    <div className="edit-rating-modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Rating: {joke.text}</h2>
          <button onClick={onClose} className="close-btn">
            <FaTimes />
          </button>
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

        {message && (
          <div className={`message ${message.includes('❌') ? 'error' : 'success'}`} style={{ marginBottom: '16px' }}>
            {message}
          </div>
        )}

        <div className="modal-actions">
          <button onClick={handleSubmit} className="submit-btn" disabled={submitting}>
            {submitting ? 'Saving...' : ratingId ? 'Update Rating' : 'Create Rating'}
          </button>
          <button onClick={onClose} className="cancel-btn" disabled={submitting}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

