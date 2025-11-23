import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface EloUpdate {
  id: string;
  joke_id: string;
  joke_text: string;
  rank: number;
  elo_score: number;
  created_at: string;
}

export default function UpdatesFeed() {
  const [updates, setUpdates] = useState<EloUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUpdates();
  }, []);

  const fetchUpdates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('elo_updates')
        .select('*')
        .lte('rank', 10)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setUpdates(data || []);
    } catch (err) {
      console.error('Fetch updates error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading updates...</p>;

  return (
    <div className="updates-feed">
      <div className="list-header">
        <h2>Leaderboard Updates (Top 10 ELO)</h2>
        <button className="refresh-btn" onClick={fetchUpdates}>Refresh</button>
      </div>
      {updates.length === 0 ? (
        <p>No updates yet.</p>
      ) : (
        <div className="updates-list">
          {updates.map((item) => (
            <div key={item.id} className="update-card">
              <div className="update-title">
                <strong>{item.joke_text}</strong> → #{item.rank} · ELO {item.elo_score}
              </div>
              <div className="update-meta">
                {new Date(item.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
