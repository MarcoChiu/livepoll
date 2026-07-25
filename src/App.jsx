/* global __BUILD_TIME__ */
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CreatePollModal from './components/CreatePollModal';
import EditPollModal from './components/EditPollModal';
import PollVoteView from './components/PollVoteView';
import ShareModal from './components/ShareModal';
import MyPollsView from './components/MyPollsView';
import PollCard from './components/PollCard';
import { subscribeAuth, isMockMode, subscribeUserPolls, deletePollDoc, loginWithGoogle } from './config/firebase';
import { Vote, Sparkles, ShieldCheck, Zap, AlertTriangle, ArrowRight, LogIn } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'mypolls' | 'vote'
  const [selectedPollId, setSelectedPollId] = useState(null);
  const [sharePollData, setSharePollData] = useState(null);
  const [editingPollData, setEditingPollData] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [demoPolls, setDemoPolls] = useState([]);

  // Set document title with build time (aligned with other projects)
  useEffect(() => {
    document.title = `線上即時投票系統 (${typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'Dev'} build)`;
  }, []);

  // Subscribe Auth
  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  // Parse GitHub Pages URL Query Parameter ?poll=ID or Hash #poll=ID
  useEffect(() => {
    const checkUrlForPoll = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const pollFromQuery = urlParams.get('poll');

      let pollFromHash = null;
      if (window.location.hash && window.location.hash.includes('poll=')) {
        const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
        pollFromHash = hashParams.get('poll');
      }

      const targetPollId = pollFromQuery || pollFromHash;
      if (targetPollId) {
        setSelectedPollId(targetPollId);
        setActiveTab('vote');
      }
    };

    checkUrlForPoll();
    window.addEventListener('popstate', checkUrlForPoll);
    return () => window.removeEventListener('popstate', checkUrlForPoll);
  }, []);

  // Subscribe demo polls for home page showcase
  useEffect(() => {
    const unsub = subscribeUserPolls('mock-user-123', (data) => {
      setDemoPolls(data);
    });
    return () => unsub();
  }, []);

  const handleSelectPoll = (pollId) => {
    setSelectedPollId(pollId);
    setActiveTab('vote');
    // Update URL query param without full page reload
    const newUrl = `${window.location.origin}${window.location.pathname}?poll=${pollId}`;
    window.history.pushState({ pollId }, '', newUrl);
  };

  const handleBackToHome = () => {
    setSelectedPollId(null);
    setActiveTab('home');
    const cleanUrl = `${window.location.origin}${window.location.pathname}`;
    window.history.pushState({}, '', cleanUrl);
  };

  const handlePollCreatedSuccess = (newPollId) => {
    setShowCreateModal(false);
    handleSelectPoll(newPollId);
  };

  return (
    <div className="app-container">
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        onHomeClick={handleBackToHome}
        onCreateClick={() => setShowCreateModal(true)}
        onMyPollsClick={() => setActiveTab('mypolls')}
      />

      {/* Mock Mode Alert Banner */}
      {isMockMode && (
        <div className="mock-banner">
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} />
            <strong>離線/Mock 模式開啟中</strong>：您目前正使用內建體驗模式。欲啟用實際 Google 登入與線上雙向同步，請至 <code>src/config/firebase.js</code> 貼上您的 Firebase Config！
          </span>
        </div>
      )}

      {/* Main View Router */}
      <main className="main-content">
        {activeTab === 'vote' && selectedPollId && (
          <PollVoteView
            pollId={selectedPollId}
            currentUser={currentUser}
            onBack={handleBackToHome}
            onShare={(poll) => setSharePollData(poll)}
            onEditPoll={(poll) => setEditingPollData(poll)}
          />
        )}

        {activeTab === 'mypolls' && currentUser && (
          <MyPollsView
            currentUser={currentUser}
            onBack={handleBackToHome}
            onSelectPoll={handleSelectPoll}
            onSharePoll={(poll) => setSharePollData(poll)}
            onEditPoll={(poll) => setEditingPollData(poll)}
            onCreateClick={() => setShowCreateModal(true)}
          />
        )}

        {activeTab === 'home' && (
          <div>
            {/* Hero Banner */}
            <div className="hero-card">
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', color: 'var(--primary)', padding: '6px 14px', borderRadius: 'var(--radius-pill)', fontSize: '0.88rem', fontWeight: 700, marginBottom: '20px' }}>
                <Sparkles size={16} /> 純前端即時同步 • 免登入投票
              </div>
              <h1 className="hero-title">建立線上即時投票<br />極速收集公眾意見</h1>
              <p className="hero-subtitle">
                發起人透過 Google 帳號登入發起投票；參與者無需登入即可參與！
                內建防刷票機制、倒數時間限制與即時動態統計圖表。
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
                {currentUser ? (
                  <button className="btn btn-primary" onClick={() => setShowCreateModal(true)} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>
                    <Vote size={20} />
                    <span>立即建立投票</span>
                    <ArrowRight size={18} />
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={loginWithGoogle} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>
                    <LogIn size={20} />
                    <span>Google 帳號登入發起投票</span>
                    <ArrowRight size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginBottom: '40px' }}>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
                <Zap size={28} color="var(--primary)" style={{ marginBottom: '12px' }} />
                <h3 style={{ fontSize: '1.05rem', marginBottom: '6px' }}>極速 Real-Time 即時刷新</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>
                  採用 Firebase Cloud Firestore 即時長通道，參與者投完票後統計圖表秒級自動平滑更新。
                </p>
              </div>

              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
                <ShieldCheck size={28} color="var(--success)" style={{ marginBottom: '12px' }} />
                <h3 style={{ fontSize: '1.05rem', marginBottom: '6px' }}>免登入雙重防刷票</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>
                  參與者無須登入即可進行投票，同時透過 LocalStorage 與裝置識別碼雙重防護防止重複投票。
                </p>
              </div>

              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
                <Vote size={28} color="var(--accent-cyan)" style={{ marginBottom: '12px' }} />
                <h3 style={{ fontSize: '1.05rem', marginBottom: '6px' }}>GitHub Pages 完美相容</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>
                  支援 Query 網址生成與現場 Mobile QR Code 掃描，在 GitHub Pages 靜態網站開啟絕不 404。
                </p>
              </div>
            </div>

            {/* Demo Polls Showcase */}
            {demoPolls.length > 0 && (
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Vote size={20} color="var(--primary)" />
                  <span>近期熱門投票示範</span>
                </h2>
                <div className="polls-grid">
                  {demoPolls.map((poll) => (
                    <PollCard
                      key={poll.id}
                      poll={poll}
                      onSelect={handleSelectPoll}
                      onShare={(pollData) => setSharePollData(pollData)}
                      onEditPoll={(pollData) => setEditingPollData(pollData)}
                      onDelete={async (pollId) => {
                        if (confirm('確定刪除示範投票？')) {
                          await deletePollDoc(pollId);
                        }
                      }}
                      isOwner={currentUser && currentUser.uid === poll.creatorId}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ marginTop: 'auto', paddingTop: '32px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <p>Live Poll Web Application • Powered by React & Firebase</p>
      </footer>

      {/* Modals */}
      {showCreateModal && (
        <CreatePollModal
          currentUser={currentUser}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handlePollCreatedSuccess}
        />
      )}

      {editingPollData && (
        <EditPollModal
          poll={editingPollData}
          onClose={() => setEditingPollData(null)}
          onSuccess={() => setEditingPollData(null)}
        />
      )}

      {sharePollData && (
        <ShareModal
          poll={sharePollData}
          onClose={() => setSharePollData(null)}
        />
      )}
    </div>
  );
}
