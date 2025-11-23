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

  // Annotate with previous rank (older record for same joke)
  const annotated = (() => {
    const prevMap = new Map<string, number>();
    const out: (EloUpdate & { prevRank: number | null })[] = new Array(updates.length);
    for (let i = updates.length - 1; i >= 0; i--) {
      const u = updates[i];
      const prevRank = prevMap.has(u.joke_id) ? prevMap.get(u.joke_id)! : null;
      out[i] = { ...u, prevRank };
      prevMap.set(u.joke_id, u.rank);
    }
    return out;
  })();

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
          {annotated.map((item) => (
            <div key={item.id} className="update-card">
              <div className="update-title">
                <strong>{item.joke_text}</strong>
                {item.prevRank ? (
                  <> went from #{item.prevRank} to <span className="update-rank-badge">#{item.rank}</span></>
                ) : (
                  <> is now <span className="update-rank-badge">#{item.rank}</span></>
                )}
                {' '}· ELO {item.elo_score}
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
