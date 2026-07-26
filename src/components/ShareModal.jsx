import React, { useState } from 'react';
import { X, Copy, Check, QrCode, Share2, Download } from 'lucide-react';
import { generateQRCodeDataUrl } from '../utils/qrcode';

export default function ShareModal({ poll, onClose }) {
  const [copied, setCopied] = useState(false);

  // Generate GitHub Pages compatible share URL using Query Param
  const shareUrl = `${window.location.origin}${window.location.pathname}?poll=${poll.id}`;
  const qrDataUrl = generateQRCodeDataUrl(shareUrl, 220);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(err => {
      alert('複製失敗: ' + err.message);
    });
  };

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(qrDataUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `poll-qrcode-${poll.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert('下載 QR Code 失敗: ' + err.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ textAlign: 'center' }}>
        <div className="modal-header">
          <div className="nav-brand" style={{ fontSize: '1.2rem' }}>
            <Share2 size={20} color="var(--primary)" />
            <span>分享投票給參與者</span>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>{poll.title}</h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-sub)', marginBottom: '20px' }}>
          相容 GitHub Pages 靜態託管，複製下方連結或手機掃碼即可即時進入投票。
        </p>

        {/* QR Code Container */}
        <div style={{ background: '#ffffff', padding: '16px', borderRadius: 'var(--radius-lg)', display: 'inline-block', marginBottom: '20px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
          <img src={qrDataUrl} alt="Poll QR Code" style={{ width: '180px', height: '180px', display: 'block' }} />
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
            <QrCode size={12} /> 手機鏡頭掃描即可投票
          </span>
          <button
            className="btn btn-outline"
            onClick={handleDownloadQR}
            style={{ marginTop: '8px', fontSize: '0.75rem', padding: '4px 8px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: '#f8fafc', color: '#334155' }}
          >
            <Download size={14} /> 下載 QR Code 圖片
          </button>
        </div>

        {/* Copy Link Input & Button */}
        <div className="share-input-group form-group">
          <input
            type="text"
            className="form-input"
            readOnly
            value={shareUrl}
            style={{ fontSize: '0.88rem', flex: 1 }}
          />
          <button className={`btn ${copied ? 'btn-secondary' : 'btn-primary'}`} onClick={handleCopy}>
            {copied ? (
              <>
                <Check size={16} color="var(--success)" />
                <span>已複製</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span>複製連結</span>
              </>
            )}
          </button>
        </div>

        <button className="btn btn-outline" onClick={onClose} style={{ width: '100%', marginTop: '12px' }}>
          關閉
        </button>
      </div>
    </div>
  );
}
