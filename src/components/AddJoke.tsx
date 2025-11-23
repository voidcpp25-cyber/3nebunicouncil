import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AddJoke() {
  const [jokeText, setJokeText] = useState('');
  const [submittedBy, setSubmittedBy] = useState<'nicky' | 'jess' | 'levi' | ''>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jokeText.trim()) {
      setMessage('Please enter a joke.');
      return;
    }

    if (!submittedBy) {
      setMessage('Please select your name.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.from('pending_jokes').insert({
        text: jokeText.trim(),
        submitted_by: submittedBy,
        approved_by_nicky: false,
        approved_by_jess: false,
        approved_by_levi: false,
        is_approved: false,
      });

      if (error) throw error;

      setMessage('Joke submitted! It will be reviewed by Nicky, Jess, and Levi.');
      setJokeText('');
      setSubmittedBy('');
    } catch (error) {
      console.error('Error submitting joke:', error);
      setMessage('Error submitting joke. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-joke">
      <h2>Add New Inside Joke</h2>
      <p className="info">
        Submit a new inside joke. It will need to be approved by Nicky, Jess, and Levi before being added to the official list.
      </p>

      {message && <p className={`message ${message.includes('Error') ? 'error' : 'success'}`}>{message}</p>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="submittedBy">Your Name:</label>
          <select
            id="submittedBy"
            value={submittedBy}
            onChange={(e) => setSubmittedBy(e.target.value as 'nicky' | 'jess' | 'levi' | '')}
            disabled={loading}
          >
            <option value="">Select your name...</option>
            <option value="nicky">Nicky</option>
            <option value="jess">Jess</option>
            <option value="levi">Levi</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="jokeText">Inside Joke:</label>
          <textarea
            id="jokeText"
            value={jokeText}
            onChange={(e) => setJokeText(e.target.value)}
            placeholder="Enter the inside joke..."
            rows={4}
            disabled={loading}
          />
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Submitting...' : 'Submit Joke'}
        </button>
      </form>
    </div>
  );
}

