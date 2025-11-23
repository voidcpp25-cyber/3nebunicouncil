import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Joke } from '../types';

interface EloUpdate {
  id: string;
  joke_id: string;
  elo_before?: number;
  elo_after: number;
  delta?: number;
  rank?: number;
  created_at: string;
}

interface Props {
  joke: Joke;
  onClose: () => void;
}

export default function JokeAnalytics({ joke, onClose }: Props) {
  const [updates, setUpdates] = useState<EloUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUpdates();
  }, [joke.id]);

  const fetchUpdates = async () => {
    setLoading(true);
    try {
      let rows: any[] = [];

      const hist = await supabase
        .from('elo_history')
        .select('*')
        .eq('joke_id', joke.id)
        .order('created_at', { ascending: true })
        .limit(300);
      if (!hist.error && hist.data) rows = hist.data;

      if (rows.length === 0) {
        const fallback = await supabase
          .from('elo_updates')
          .select('*')
          .eq('joke_id', joke.id)
          .order('created_at', { ascending: true })
          .limit(300);
        if (fallback.error) throw fallback.error;
        rows = fallback.data || [];
      }

      setUpdates(
        rows.map((d: any) => ({
          id: d.id,
          joke_id: d.joke_id,
          elo_before: d.elo_before ?? d.elo_after ?? d.elo_score ?? 0,
          elo_after: d.elo_after ?? d.elo_score ?? d.elo_before ?? 0,
          delta: d.delta,
          rank: d.rank,
          created_at: d.created_at,
        }))
      );
    } catch (err) {
      console.error('Fetch analytics updates error:', err);
    } finally {
      setLoading(false);
    }
  };

  const sorted = useMemo(
    () => [...updates].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [updates]
  );

  const { points, minElo, maxElo } = useMemo(() => {
    if (!sorted.length) return { points: '', minElo: 0, maxElo: 0 };
    const minRaw = Math.min(...sorted.map(u => u.elo_after));
    const maxRaw = Math.max(...sorted.map(u => u.elo_after));
    const pad = Math.max(10, Math.round((maxRaw - minRaw) * 0.1));
    const min = minRaw - pad;
    const max = maxRaw + pad;
    const range = Math.max(1, max - min);
    const width = 600;
    const height = 240;
    const step = sorted.length > 1 ? width / (sorted.length - 1) : width;
    const pts = sorted.map((u, i) => {
      const x = Math.round(i * step);
      const y = Math.round(height - ((u.elo_after - min) / range) * height);
      return `${x},${y}`;
    }).join(' ');
    return { points: pts, minElo: minRaw, maxElo: maxRaw };
  }, [sorted]);

  return (
    <div className="edit-rating-modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>ELO Analytics: {joke.text}</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        {loading ? (
          <p>Loading history...</p>
        ) : updates.length === 0 ? (
          <p>No ELO history yet for this joke. Ensure the elo_history table is populated.</p>
        ) : (
          <>
            <div className="analytics-meta">
              <span>Points: {updates.length}</span>
              <span>Range: {minElo} – {maxElo}</span>
            </div>
            <div className="analytics-chart">
              <div className="analytics-axis-label">Oldest ➜ Latest</div>
              <svg viewBox="0 0 600 240" preserveAspectRatio="none">
                <polyline
                  fill="none"
                  stroke="#4ade80"
                  strokeWidth="3"
                  points={points}
                />
                {sorted.map((u, idx) => {
                  const width = 600;
                  const height = 240;
                  const pad = Math.max(10, Math.round((maxElo - minElo) * 0.1));
                  const min = minElo - pad;
                  const max = maxElo + pad;
                  const range = Math.max(1, max - min);
                  const step = sorted.length > 1 ? width / (sorted.length - 1) : width;
                  const x = Math.round(idx * step);
                  const y = Math.round(height - ((u.elo_after - min) / range) * height);
                  return <circle key={u.id} cx={x} cy={y} r={3} fill="#22c55e" />;
                })}
              </svg>
            </div>
            <div className="updates-list">
              {sorted.slice().reverse().map(u => (
                <div key={u.id} className="update-card">
                  <div className="update-title">
                    {u.rank ? `#${u.rank} · ` : ''}ELO {u.elo_after} {u.delta !== undefined ? `(Δ ${u.delta >= 0 ? '+' : ''}${u.delta})` : ''}
                  </div>
                  <div className="update-meta">
                    {new Date(u.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
