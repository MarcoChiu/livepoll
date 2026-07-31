import React, { useState, useEffect } from 'react';
import { Clock, Eye, Lock, ArrowLeft, CheckCircle2, AlertCircle, Share2, Edit3, Trash2, ShieldCheck, LogIn, Plus } from 'lucide-react';
import confetti from 'canvas-confetti';
import { subscribePoll, submitVote, deletePollDoc, loginWithGoogle } from '../config/firebase';
import { getVoterDeviceId, hasVotedLocally, recordLocalVote } from '../utils/voterId';
import PollResults from './PollResults';

export default function PollVoteView({ pollId, currentUser, onBack, onShare, onEditPoll }) {
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [timeLeftStr, setTimeLeftStr] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [customAddedOptions, setCustomAddedOptions] = useState([]);
  const [customOptionText, setCustomOptionText] = useState('');

  const voterFingerprint = getVoterDeviceId();

  // Subscribe to Realtime Poll Data
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribePoll(pollId, (data) => {
      setPoll(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [pollId]);

  // Check if voter has already voted
  const hasVoted = poll && (hasVotedLocally(pollId) || (poll.voterIds && poll.voterIds.includes(voterFingerprint)));

  // Countdown timer effect
  useEffect(() => {
    if (!poll || !poll.hasTimeLimit || !poll.expiresAt) return;

    const updateTimer = () => {
      const diff = new Date(poll.expiresAt) - new Date();
      if (diff <= 0) {
        setTimeLeftStr('投票已截止');
        setIsExpired(true);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeftStr(`${hours > 0 ? `${hours}小時 ` : ''}${minutes}分 ${seconds}秒`);
        setIsExpired(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [poll]);

  // Option selection logic
  const isClosedOrExpired = isExpired || (poll && poll.isClosed);

  const handleOptionToggle = (optionId) => {
    if (hasVoted || isClosedOrExpired) return;
    if (poll.requireGoogleLogin && !currentUser) return;

    if (customAddedOptions.length > 0 && !customAddedOptions.find(o => o.id === optionId)) {
      alert("您已新增自定義選項，只能投給您自定義的選項！");
      return;
    }

    if (poll.allowMultiple) {
      if (selectedOptions.includes(optionId)) {
        setSelectedOptions(selectedOptions.filter(id => id !== optionId));
      } else {
        setSelectedOptions([...selectedOptions, optionId]);
      }
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const handleAddCustomOption = () => {
    if (!customOptionText.trim()) return;
    
    if (poll.requireGoogleLogin && !currentUser) {
      alert('新增選項需要登入 Google 帳號，請先登入。');
      return;
    }

    if (customAddedOptions.length > 0 && !poll.allowMultiple) {
      alert('此投票為單選，您只能新增一個選項！');
      return;
    }

    const newOpt = {
      id: 'custom-' + Date.now(),
      text: customOptionText.trim()
    };
    
    setCustomAddedOptions([...customAddedOptions, newOpt]);
    
    if (!poll.allowMultiple) {
      setSelectedOptions([newOpt.id]);
    } else {
      setSelectedOptions([...selectedOptions, newOpt.id].filter(id => {
         return customAddedOptions.find(o => o.id === id) || id === newOpt.id;
      }));
    }
    
    setCustomOptionText('');
  };

  // Vote Submission
  const handleVoteSubmit = async () => {
    if (selectedOptions.length === 0) {
      alert('請先選擇至少一個選項！');
      return;
    }

    // Check Google login requirement
    if (poll.requireGoogleLogin && !currentUser) {
      alert('此投票需要登入 Google 帳號才能參與，請先登入。');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitVote(pollId, selectedOptions, voterFingerprint, customAddedOptions);
      recordLocalVote(pollId, selectedOptions);

      // Trigger Confetti Celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      setShowResults(true);
    } catch (err) {
      alert(err.message || '投票失敗，請再試一次');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="poll-detail-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ color: 'var(--text-sub)' }}>正在載入即時投票資料...</p>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="poll-detail-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <AlertCircle size={48} color="var(--danger)" style={{ margin: '0 auto 16px' }} />
        <h2>找不到此投票或已被刪除</h2>
        <button className="btn btn-outline" onClick={onBack} style={{ marginTop: '20px' }}>
          <ArrowLeft size={16} /> 返回首頁
        </button>
      </div>
    );
  }

  const canViewResults = hasVoted || isClosedOrExpired || poll.showResultsBeforeVote;

  const handleDeletePoll = async () => {
    if (confirm('確定要刪除此投票嗎？此動作將無法復原。')) {
      try {
        await deletePollDoc(pollId);
        onBack();
      } catch (err) {
        alert('刪除失敗: ' + err.message);
      }
    }
  };

  return (
    <div className="poll-detail-container">
      {/* Top Bar */}
      <div className="poll-top-bar">
        <button className="btn btn-outline" onClick={onBack} title="返回首頁">
          <ArrowLeft size={16} />
          <span className="btn-top-text">返回</span>
        </button>

        <div className="poll-top-actions">
          {currentUser && poll && currentUser.uid === poll.creatorId && (
            <>
              {onEditPoll && (
                <button className="btn btn-outline" onClick={() => onEditPoll(poll)} title="修改投票">
                  <Edit3 size={16} color="var(--primary)" />
                  <span className="btn-top-text">修改</span>
                </button>
              )}
              <button className="btn btn-danger" onClick={handleDeletePoll} title="刪除投票">
                <Trash2 size={16} />
                <span className="btn-top-text">刪除</span>
              </button>
            </>
          )}

          <button className="btn btn-outline" onClick={() => onShare(poll)} title="分享投票">
            <Share2 size={16} />
            <span className="btn-top-text">分享</span>
          </button>

          {canViewResults && !isClosedOrExpired && (
            <button
              className="btn btn-secondary"
              onClick={() => setShowResults(!showResults)}
              title={showResults ? '返回投票' : '觀看結果'}
            >
              <Eye size={16} />
              <span className="btn-top-text">{showResults ? '返回投票' : '觀看結果'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Header Info */}
      <div className="poll-detail-header">
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <span className={`badge ${isClosedOrExpired ? 'badge-expired' : 'badge-active'}`}>
            {isClosedOrExpired ? '已截止' : '進行中'}
          </span>
          {poll.allowMultiple && <span className="badge badge-multi">可複選</span>}
          {poll.requireGoogleLogin && (
            <span className="badge" style={{ background: 'rgba(251, 191, 36, 0.18)', color: 'var(--warning)', border: '1px solid rgba(251, 191, 36, 0.4)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={12} /> 需登入 Google
            </span>
          )}
        </div>

        <h1 className="poll-title-large">{poll.title}</h1>
        {poll.description && (
          <p style={{ color: 'var(--text-sub)', fontSize: '1rem', marginTop: '6px' }}>
            {poll.description}
          </p>
        )}

        {poll.hasTimeLimit && (
          <div className="countdown-box" style={{ marginTop: '14px' }}>
            <Clock size={16} />
            <span>{isClosedOrExpired ? '投票已截止' : `剩餘時間：${timeLeftStr}`}</span>
          </div>
        )}
      </div>

      {/* Body: Vote Options vs Results */}
      {showResults || (hasVoted && !poll.showResultsBeforeVote) ? (
        <PollResults poll={poll} onShare={onShare} />
      ) : (
        <div>
          {hasVoted ? (
            <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '14px 18px', borderRadius: 'var(--radius-md)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--success)' }}>
              <CheckCircle2 size={20} />
              <span>您已經完成此投票！可以點擊右上角「觀看結果」即時關心最新票數。</span>
            </div>
          ) : isClosedOrExpired ? (
            <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '14px 18px', borderRadius: 'var(--radius-md)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--danger)' }}>
              <Lock size={20} />
              <span>{poll.isClosed ? '此投票已被發起人關閉截止，無法再進行投遞。' : '此投票已過期截止，無法再進行投遞。'}</span>
            </div>
          ) : null}

          {/* Google Login Required Block */}
          {poll.requireGoogleLogin && !currentUser && !hasVoted && !isClosedOrExpired && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.12), rgba(245, 158, 11, 0.08))',
              border: '1px solid rgba(251, 191, 36, 0.35)',
              padding: '20px 22px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--warning)' }}>
                <ShieldCheck size={22} />
                <span style={{ fontWeight: 600, fontSize: '1rem' }}>此投票需要登入 Google 帳號才能參與</span>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-sub)', margin: 0 }}>
                發起人已啟用身份驗證，進行投票前請先登入您的 Google 帳號。
              </p>
              <button
                className="btn btn-primary"
                style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
                onClick={async () => {
                  try {
                    await loginWithGoogle();
                  } catch (err) {
                    alert('登入失敗: ' + err.message);
                  }
                }}
              >
                <LogIn size={16} />
                <span>登入 Google 帳號</span>
              </button>
            </div>
          )}

          {!poll.showResultsBeforeVote && !hasVoted && (
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)', padding: '10px 14px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '0.88rem', color: 'var(--primary)' }}>
              🔒 發起人設定：未投票前隱藏統計，投完票後將自動解鎖即時票數結果。
            </div>
          )}

          <div className="voting-options-list">
            {poll.options.map((opt) => {
              const isSelected = selectedOptions.includes(opt.id);
              const isDisabled = customAddedOptions.length > 0;
              return (
                <div
                  key={opt.id}
                  className={`voting-option-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleOptionToggle(opt.id)}
                  style={{ opacity: isDisabled ? 0.5 : 1, cursor: isDisabled ? 'not-allowed' : 'pointer' }}
                >
                  <span className="option-text">{opt.text}</span>
                  <div style={{ width: '22px', height: '22px', borderRadius: poll.allowMultiple ? '6px' : '50%', border: isSelected ? '6px solid var(--primary)' : '2px solid var(--border-color)', background: isSelected ? '#fff' : 'transparent', transition: 'all 0.15s ease' }} />
                </div>
              );
            })}
            
            {customAddedOptions.map((opt) => {
              const isSelected = selectedOptions.includes(opt.id);
              return (
                <div
                  key={opt.id}
                  className={`voting-option-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleOptionToggle(opt.id)}
                >
                  <span className="option-text">{opt.text} <span style={{fontSize: '0.8rem', color: 'var(--success)', marginLeft: '6px'}}>(您新增的選項)</span></span>
                  <div style={{ width: '22px', height: '22px', borderRadius: poll.allowMultiple ? '6px' : '50%', border: isSelected ? '6px solid var(--primary)' : '2px solid var(--border-color)', background: isSelected ? '#fff' : 'transparent', transition: 'all 0.15s ease' }} />
                </div>
              );
            })}
          </div>

          {!hasVoted && !isClosedOrExpired && poll.allowCustomOptions && (
            <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="輸入並新增自定義選項..." 
                value={customOptionText}
                onChange={(e) => setCustomOptionText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCustomOption()}
                style={{ flex: 1 }}
              />
              <button type="button" className="btn btn-outline" onClick={handleAddCustomOption}>
                <Plus size={16} /> 新增
              </button>
            </div>
          )}

          {!hasVoted && !isExpired && !(poll.requireGoogleLogin && !currentUser) && (
            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '1.05rem', marginTop: '12px' }}
              disabled={selectedOptions.length === 0 || isSubmitting}
              onClick={handleVoteSubmit}
            >
              {isSubmitting ? '投票送出中...' : '🗳️ 確認送出投票'}
            </button>
          )}

          {canViewResults && !showResults && (
            <button
              className="btn btn-outline"
              style={{ width: '100%', padding: '12px', marginTop: '12px' }}
              onClick={() => setShowResults(true)}
            >
              <Eye size={16} /> 觀看即時票數圖表
            </button>
          )}
        </div>
      )}
    </div>
  );
}
