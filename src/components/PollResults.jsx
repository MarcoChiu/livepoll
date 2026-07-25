import React from 'react';
import { BarChart3, Trophy, Users, Share2, Sparkles } from 'lucide-react';

export default function PollResults({ poll, onShare }) {
  const totalVotes = poll.totalVotes || 0;
  
  // Find highest vote count to highlight winner(s)
  const maxVotes = Math.max(...(poll.options || []).map(o => o.votes || 0), 0);

  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', fontWeight: 700 }}>
          <BarChart3 size={20} color="var(--primary)" />
          <span>即時投票結果 (Real-Time Live)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', color: 'var(--text-sub)' }}>
          <Users size={16} />
          <span>累計總票數：{totalVotes} 票</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {poll.options.map((opt) => {
          const votes = opt.votes || 0;
          const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
          const isWinner = maxVotes > 0 && votes === maxVotes;

          return (
            <div key={opt.id} className="result-item">
              <div className="result-header">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isWinner && <Trophy size={16} color="#fbbf24" />}
                  <span>{opt.text}</span>
                </span>
                <span className="result-count">
                  {votes} 票 ({percentage}%)
                </span>
              </div>
              <div className="result-bar-bg">
                <div 
                  className={`result-bar-fill ${isWinner ? 'winner' : ''}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Sparkles size={14} color="var(--accent-cyan)" />
          票數即時更新中 (無須刷新)
        </span>
        <button className="btn btn-outline" onClick={() => onShare(poll)}>
          <Share2 size={16} />
          <span>分享此投票</span>
        </button>
      </div>
    </div>
  );
}
