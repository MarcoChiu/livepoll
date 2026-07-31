import React, { useState } from 'react';
import { X, Plus, Trash2, Clock, Eye, CheckSquare, Sparkles, ShieldCheck } from 'lucide-react';
import { createPollDoc, loginWithGoogle } from '../config/firebase';

export default function CreatePollModal({ currentUser, onClose, onSuccess }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['選項一', '選項二']);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [allowCustomOptions, setAllowCustomOptions] = useState(false);
  const [showResultsBeforeVote, setShowResultsBeforeVote] = useState(true);
  const [requireGoogleLogin, setRequireGoogleLogin] = useState(false);
  
  // Expiration settings
  const [timePreset, setTimePreset] = useState('none'); // 'none' | '10m' | '1h' | '24h' | 'custom'
  const [customDateTime, setCustomDateTime] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddOption = () => {
    if (options.length >= 10) {
      alert('最多新增 10 個投票選項');
      return;
    }
    setOptions([...options, `選項${options.length + 1}`]);
  };

  const handleRemoveOption = (index) => {
    if (options.length <= 2) {
      alert('投票至少需要 2 個選項');
      return;
    }
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index, value) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      if (confirm('發起投票需先登入 Google 帳號，是否立即進行登入？')) {
        try {
          await loginWithGoogle();
        } catch (err) {
          alert('登入失敗: ' + err.message);
          return;
        }
      }
      return;
    }

    if (!title.trim()) {
      alert('請輸入投票題目');
      return;
    }

    const validOptions = options.map(o => o.trim()).filter(Boolean);
    if (validOptions.length < 2) {
      alert('請至少填寫 2 個有效選項');
      return;
    }

    // Calculate expiration date
    let expiresAt = null;
    let hasTimeLimit = false;

    const now = new Date();
    if (timePreset === '10m') {
      hasTimeLimit = true;
      expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString();
    } else if (timePreset === '1h') {
      hasTimeLimit = true;
      expiresAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    } else if (timePreset === '24h') {
      hasTimeLimit = true;
      expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    } else if (timePreset === 'custom' && customDateTime) {
      hasTimeLimit = true;
      expiresAt = new Date(customDateTime).toISOString();
    }

    setLoading(true);
    try {
      const pollData = {
        title: title.trim(),
        description: description.trim(),
        options: validOptions.map((text, idx) => ({
          id: `opt-${idx + 1}`,
          text,
          votes: 0
        })),
        allowMultiple,
        allowCustomOptions,
        showResultsBeforeVote,
        requireGoogleLogin,
        hasTimeLimit,
        expiresAt,
        creatorId: currentUser.uid,
        creatorEmail: currentUser.email || '',
        creatorName: currentUser.displayName || currentUser.email || 'Anonymous Creator'
      };

      const pollId = await createPollDoc(pollData);
      onSuccess(pollId);
    } catch (err) {
      alert('建立投票失敗: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <div className="nav-brand" style={{ fontSize: '1.2rem' }}>
            <Sparkles size={20} color="var(--primary)" />
            <span>建立發起新投票</span>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Poll Title */}
          <div className="form-group">
            <label className="form-label">投票題目 *</label>
            <input
              type="text"
              className="form-input"
              placeholder="例如：這週末團隊聚餐地點要選哪裡？"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">補充說明 (選填)</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="添加投票背景資訊或備註..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Options */}
          <div className="form-group">
            <label className="form-label">投票選項 *</label>
            {options.map((opt, idx) => (
              <div key={idx} className="option-row">
                <input
                  type="text"
                  className="form-input"
                  placeholder={`選項 ${idx + 1}`}
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  required
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => handleRemoveOption(idx)}
                    style={{ padding: '10px' }}
                  >
                    <Trash2 size={16} color="var(--danger)" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleAddOption}
              style={{ width: '100%', marginTop: '6px' }}
            >
              <Plus size={16} />
              <span>新增選項</span>
            </button>
          </div>

          {/* Rules & Toggles */}
          <div className="form-group" style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <label className="checkbox-label" style={{ marginBottom: '12px' }}>
              <input
                type="checkbox"
                checked={allowMultiple}
                onChange={(e) => setAllowMultiple(e.target.checked)}
              />
              <CheckSquare size={18} color="var(--accent-purple)" />
              <span>允許複選 (投票者可勾選多個選項)</span>
            </label>

            <label className="checkbox-label" style={{ marginBottom: '12px' }}>
              <input
                type="checkbox"
                checked={allowCustomOptions}
                onChange={(e) => setAllowCustomOptions(e.target.checked)}
              />
              <Plus size={18} color="var(--success)" />
              <span>允許使用者自定義新增選項</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showResultsBeforeVote}
                onChange={(e) => setShowResultsBeforeVote(e.target.checked)}
              />
              <Eye size={18} color="var(--accent-cyan)" />
              <span>允許投票前觀看即時結果 (未勾選則需投完票才解鎖)</span>
            </label>

            <label className="checkbox-label" style={{ marginTop: '12px' }}>
              <input
                type="checkbox"
                checked={requireGoogleLogin}
                onChange={(e) => setRequireGoogleLogin(e.target.checked)}
              />
              <ShieldCheck size={18} color="var(--warning)" />
              <span>必須登入 Google 帳號才能投票 (防止匿名灌票)</span>
            </label>
          </div>

          {/* Time Limit Setting */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} color="var(--warning)" />
              <span>投票時間限制</span>
            </label>
            <select
              className="form-select"
              value={timePreset}
              onChange={(e) => setTimePreset(e.target.value)}
            >
              <option value="none">不限時間 (永久有效)</option>
              <option value="10m">10 分鐘限時投票</option>
              <option value="1h">1 小時限時投票</option>
              <option value="24h">24 小時限時投票</option>
              <option value="custom">自訂截止時間</option>
            </select>

            {timePreset === 'custom' && (
              <input
                type="datetime-local"
                className="form-input"
                style={{ marginTop: '10px' }}
                value={customDateTime}
                onChange={(e) => setCustomDateTime(e.target.value)}
                required
              />
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose} style={{ flex: 1 }}>
              取消
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2 }}>
              {loading ? '發起中...' : '🚀 立即發起投票'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
