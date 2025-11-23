import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { PendingJoke } from '../types';

export default function PendingJokes() {
  const [pendingJokes, setPendingJokes] = useState<PendingJoke[]>([]);
  const [currentUser, setCurrentUser] = useState<'nicky' | 'jess' | 'levi' | ''>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPendingJokes();
  }, []);

  const fetchPendingJokes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pending_jokes')
        .select('*')
        .eq('is_approved', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingJokes(data || []);
    } catch (error) {
      console.error('Error fetching pending jokes:', error);
      setMessage('Error loading pending jokes.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (jokeId: string, approver: 'nicky' | 'jess' | 'levi') => {
    if (!currentUser) {
      setMessage('Please select who you are first.');
      return;
    }

    if (currentUser !== approver) {
      setMessage(`You can only approve as ${currentUser}.`);
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Update the approval status
      const approvalField = `approved_by_${approver}`;
      const { data: joke, error: fetchError } = await supabase
        .from('pending_jokes')
        .select('*')
        .eq('id', jokeId)
        .single();

      if (fetchError) throw fetchError;

      // Update the specific approval field
      const updateData: any = {
        [approvalField]: true,
      };

      // First update the approval
      const { error: updateError } = await supabase
        .from('pending_jokes')
        .update(updateData)
        .eq('id', jokeId);

      if (updateError) throw updateError;

      // Fetch updated joke to check if all approved
      const { data: updatedJoke, error: fetchUpdatedError } = await supabase
        .from('pending_jokes')
        .select('*')
        .eq('id', jokeId)
        .single();

      if (fetchUpdatedError) throw fetchUpdatedError;

      // Check if at least 2 have approved
      const approvalCount = 
        (updatedJoke.approved_by_nicky ? 1 : 0) +
        (updatedJoke.approved_by_jess ? 1 : 0) +
        (updatedJoke.approved_by_levi ? 1 : 0);
      
      const hasEnoughApprovals = approvalCount >= 2;

      if (hasEnoughApprovals && !updatedJoke.is_approved) {
        // Move to official jokes table
        const { error: insertError } = await supabase.from('jokes').insert({
          text: updatedJoke.text,
          is_official: true,
        });

        if (insertError) throw insertError;

        // Mark as approved in pending_jokes
        await supabase
          .from('pending_jokes')
          .update({ is_approved: true })
          .eq('id', jokeId);

        setMessage(`Joke approved by ${approvalCount} people! It has been added to the official list.`);
      } else {
        setMessage(`Approved as ${approver}! ${approvalCount}/2 approvals.`);
      }

      fetchPendingJokes();
    } catch (error) {
      console.error('Error approving joke:', error);
      setMessage('Error approving joke. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getApprovalStatus = (joke: PendingJoke) => {
    const approvals = [];
    if (joke.approved_by_nicky) approvals.push('Nicky');
    if (joke.approved_by_jess) approvals.push('Jess');
    if (joke.approved_by_levi) approvals.push('Levi');
    return approvals.length > 0 ? `Approved by: ${approvals.join(', ')}` : 'No approvals yet';
  };

  return (
    <div className="pending-jokes">
      <h2>Pending Jokes Approval</h2>
      <p className="info">
        Only Nicky, Jess, and Levi can approve jokes. Jokes need at least 2 approvals to be added to the official list. Select your identity below.
      </p>

      <div className="user-selector">
        <label>Who are you?</label>
        <select
          value={currentUser}
          onChange={(e) => setCurrentUser(e.target.value as 'nicky' | 'jess' | 'levi' | '')}
        >
          <option value="">Select...</option>
          <option value="nicky">Nicky</option>
          <option value="jess">Jess</option>
          <option value="levi">Levi</option>
        </select>
      </div>

      {message && <p className={`message ${message.includes('Error') ? 'error' : 'success'}`}>{message}</p>}

      {loading && pendingJokes.length === 0 ? (
        <p>Loading pending jokes...</p>
      ) : pendingJokes.length === 0 ? (
        <p>No pending jokes. All clear! 🎉</p>
      ) : (
        <div className="pending-list">
          {pendingJokes.map((joke) => (
            <div key={joke.id} className="pending-joke-card">
              <div className="joke-text">{joke.text}</div>
              <div className="joke-meta">
                <p>Submitted by: {joke.submitted_by}</p>
                <p>Submitted on: {new Date(joke.created_at).toLocaleDateString()}</p>
                <p className="approval-status">{getApprovalStatus(joke)}</p>
              </div>
              <div className="approval-buttons">
                {!joke.approved_by_nicky && (
                  <button
                    onClick={() => handleApprove(joke.id, 'nicky')}
                    disabled={loading || currentUser !== 'nicky'}
                    className="approve-btn"
                  >
                    Approve as Nicky
                  </button>
                )}
                {!joke.approved_by_jess && (
                  <button
                    onClick={() => handleApprove(joke.id, 'jess')}
                    disabled={loading || currentUser !== 'jess'}
                    className="approve-btn"
                  >
                    Approve as Jess
                  </button>
                )}
                {!joke.approved_by_levi && (
                  <button
                    onClick={() => handleApprove(joke.id, 'levi')}
                    disabled={loading || currentUser !== 'levi'}
                    className="approve-btn"
                  >
                    Approve as Levi
                  </button>
                )}
                {((joke.approved_by_nicky ? 1 : 0) + (joke.approved_by_jess ? 1 : 0) + (joke.approved_by_levi ? 1 : 0) >= 2) && (
                  <p className="fully-approved">✓ Approved by 2+ people and added to official list!</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

