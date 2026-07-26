import React from 'react';
import { Users, Clock, Share2, Trash2, CheckCircle2, Lock, Edit3, ShieldCheck } from 'lucide-react';

export default function PollCard({ poll, onSelect, onShare, onDelete, onClosePoll, onEditPoll, isOwner }) {
  const isExpired = poll.isClosed || (poll.hasTimeLimit && poll.expiresAt && new Date() > new Date(poll.expiresAt));
  const badgeText = poll.isClosed ? '已截止' : (isExpired ? '已截止' : '進行中');

  return (
    <div className="poll-card" onClick={() => onSelect(poll.id)}>
      <div>
        <div className="poll-card-header">
          <h3 className="poll-card-title">{poll.title}</h3>
          <span className={`badge ${isExpired ? 'badge-expired' : 'badge-active'}`}>
            {badgeText}
          </span>
        </div>

        {poll.description && (
          <p style={{ fontSize: '0.88rem', color: 'var(--text-sub)', marginBottom: '14px', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {poll.description}
          </p>
        )}
      </div>

      <div>
        <div className="poll-card-meta">
          <div className="poll-meta-item">
            <Users size={15} />
            <span>{poll.totalVotes || 0} 人次參與</span>
          </div>

          {poll.allowMultiple && (
            <div className="poll-meta-item" style={{ color: 'var(--accent-purple)' }}>
              <CheckCircle2 size={15} />
              <span>複選</span>
            </div>
          )}

          {poll.requireGoogleLogin && (
            <div className="poll-meta-item" style={{ color: 'var(--warning)' }}>
              <ShieldCheck size={15} />
              <span>需登入</span>
            </div>
          )}

          <div className="poll-card-actions">
            <button
              className="btn btn-outline"
              onClick={(e) => {
                e.stopPropagation();
                onShare(poll);
              }}
              style={{ padding: '6px' }}
              title="分享投票"
            >
              <Share2 size={15} />
            </button>

            {isOwner && onEditPoll && (
              <button
                className="btn btn-outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditPoll(poll);
                }}
                style={{ padding: '6px', color: 'var(--primary)' }}
                title="修改投票選項與內容"
              >
                <Edit3 size={15} />
              </button>
            )}

            {isOwner && !isExpired && (
              <button
                className="btn btn-outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onClosePoll(poll.id);
                }}
                style={{ padding: '6px', color: 'var(--warning, #f59e0b)' }}
                title="提前結束投票"
              >
                <Lock size={15} />
              </button>
            )}

            {isOwner && (
              <button
                className="btn btn-danger"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(poll.id);
                }}
                style={{ padding: '6px' }}
                title="刪除投票"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
