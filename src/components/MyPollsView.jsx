import React, { useState, useEffect } from 'react';
import { PlusCircle, List, ArrowLeft } from 'lucide-react';
import { subscribeUserPolls, deletePollDoc, closePollDoc } from '../config/firebase';
import PollCard from './PollCard';

export default function MyPollsView({ currentUser, onSelectPoll, onSharePoll, onCreateClick, onEditPoll, onBack }) {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    const unsubscribe = subscribeUserPolls(currentUser.uid, (data) => {
      setPolls(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const handleDelete = async (pollId) => {
    if (confirm('確定要刪除此投票嗎？此動作將無法復原。')) {
      try {
        await deletePollDoc(pollId);
      } catch (err) {
        alert('刪除失敗: ' + err.message);
      }
    }
  };

  const handleClose = async (pollId) => {
    if (confirm('確定要提前結束此投票嗎？結束後參與者將無法繼續投票。')) {
      try {
        await closePollDoc(pollId);
      } catch (err) {
        alert('結束投票失敗: ' + err.message);
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-outline" onClick={onBack}>
            <ArrowLeft size={16} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.4rem', fontWeight: 800 }}>
            <List size={24} color="var(--primary)" />
            <span>我發起的投票</span>
          </div>
        </div>

        <button className="btn btn-primary" onClick={onCreateClick}>
          <PlusCircle size={18} />
          <span>發起新投票</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-sub)' }}>
          載入專屬投票清單中...
        </div>
      ) : polls.length === 0 ? (
        <div className="hero-card" style={{ padding: '40px 20px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>您目前尚未發起任何投票</h3>
          <p style={{ color: 'var(--text-sub)', marginBottom: '20px' }}>點擊下方按鈕立即發起您的第一個即時投票！</p>
          <button className="btn btn-primary" onClick={onCreateClick}>
            <PlusCircle size={18} /> 立即發起投票
          </button>
        </div>
      ) : (
        <div className="polls-grid">
          {polls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              onSelect={onSelectPoll}
              onShare={onSharePoll}
              onDelete={handleDelete}
              onClosePoll={handleClose}
              onEditPoll={onEditPoll}
              isOwner={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
