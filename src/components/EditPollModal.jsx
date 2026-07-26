import React, { useState } from 'react';
import { X, Plus, Trash2, Edit3, CheckSquare, Eye, ShieldCheck } from 'lucide-react';
import { updatePollDoc } from '../config/firebase';

export default function EditPollModal({ poll, onClose, onSuccess }) {
  const [title, setTitle] = useState(poll.title || '');
  const [description, setDescription] = useState(poll.description || '');
  const [options, setOptions] = useState(poll.options ? poll.options.map(o => o.text) : []);
  const [allowMultiple, setAllowMultiple] = useState(poll.allowMultiple || false);
  const [showResultsBeforeVote, setShowResultsBeforeVote] = useState(poll.showResultsBeforeVote !== false);
  const [requireGoogleLogin, setRequireGoogleLogin] = useState(poll.requireGoogleLogin || false);
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

    if (!title.trim()) {
      alert('請輸入投票題目');
      return;
    }

    const validOptionTexts = options.map(o => o.trim()).filter(Boolean);
    if (validOptionTexts.length < 2) {
      alert('請至少填寫 2 個有效選項');
      return;
    }

    // Preserve existing vote counts for existing options or assign new IDs
    const updatedOptions = validOptionTexts.map((text, idx) => {
      const existingOpt = poll.options && poll.options[idx];
      return {
        id: existingOpt ? existingOpt.id : `opt-${idx + 1}-${Date.now()}`,
        text: text,
        votes: existingOpt ? (existingOpt.votes || 0) : 0
      };
    });

    setLoading(true);
    try {
      await updatePollDoc(poll.id, {
        title: title.trim(),
        description: description.trim(),
        options: updatedOptions,
        allowMultiple,
        showResultsBeforeVote,
        requireGoogleLogin
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      alert('修改投票失敗: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <div className="nav-brand" style={{ fontSize: '1.2rem' }}>
            <Edit3 size={20} color="var(--primary)" />
            <span>修改投票內容</span>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">投票題目 *</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">補充說明 (選填)</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">投票選項 *</label>
            {options.map((optText, index) => (
              <div key={index} className="option-row">
                <input
                  type="text"
                  className="form-input"
                  value={optText}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  required
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => handleRemoveOption(index)}
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

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose} style={{ flex: 1 }}>
              取消
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2 }}>
              {loading ? '儲存中...' : '💾 儲存修改內容'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
