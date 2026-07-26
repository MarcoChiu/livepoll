import React from 'react';
import { Vote, PlusCircle, LogIn, LogOut, User, List } from 'lucide-react';
import { loginWithGoogle, logoutUser } from '../config/firebase';

export default function Navbar({ currentUser, onCreateClick, onMyPollsClick, onHomeClick, activeTab }) {
  const handleAuthAction = async () => {
    try {
      if (currentUser) {
        await logoutUser();
      } else {
        await loginWithGoogle();
      }
    } catch (err) {
      alert('登入/登出發生錯誤: ' + err.message);
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-brand" onClick={onHomeClick} style={{ cursor: 'pointer' }}>
        <div className="nav-logo-icon" style={{ background: '#ffffff', borderRadius: '8px', padding: '2px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
          <img src="./logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '6px' }} />
        </div>
        <span className="nav-brand-title">線上即時投票系統</span>
      </div>

      <div className="nav-actions">
        {currentUser && (
          <>
            <button 
              className={`btn ${activeTab === 'mypolls' ? 'btn-secondary' : 'btn-outline'}`}
              onClick={onMyPollsClick}
              title="我的投票"
            >
              <List size={18} />
              <span className="btn-nav-text">我的投票</span>
            </button>

            <button className="btn btn-primary" onClick={onCreateClick} title="發起投票">
              <PlusCircle size={18} />
              <span className="btn-nav-text">發起投票</span>
            </button>
          </>
        )}

        {currentUser ? (
          <div className="user-profile">
            {currentUser.photoURL ? (
              <img src={currentUser.photoURL} alt="User Avatar" className="user-avatar" />
            ) : (
              <User size={18} className="user-avatar" />
            )}
            <span className="user-name">{currentUser.displayName || currentUser.email}</span>
            <button 
              className="btn btn-outline" 
              onClick={handleAuthAction}
              title="登出"
              style={{ padding: '5px 8px', borderRadius: '50%' }}
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <button className="btn btn-secondary" onClick={handleAuthAction} title="Google 登入">
            <LogIn size={18} />
            <span className="btn-nav-text">Google 登入</span>
          </button>
        )}
      </div>
    </nav>
  );
}
