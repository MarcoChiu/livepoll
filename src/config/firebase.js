import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  runTransaction 
} from 'firebase/firestore';

// ============================================================================
// 📌 FIREBASE 專案設定檔 (FIREBASE CONFIGURATION)
// 請將從 Firebase Console (https://console.firebase.google.com/) 取得之設定貼入下方
// ============================================================================
// 優先讀取環境變數 (如 .env 或 .env.local)
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

// 判斷是否已經填入真實的 Firebase API Key
export const isMockMode = !firebaseConfig.apiKey || firebaseConfig.apiKey.includes("YOUR_API_KEY");

let app;
let auth;
let db;
let googleProvider;

if (!isMockMode) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
  } catch (err) {
    console.warn("Firebase initialization failed, switching to Mock Mode:", err);
  }
}

// ----------------------------------------------------------------------------
// 🔐 Auth Helpers (認證輔助)
// ----------------------------------------------------------------------------
export const loginWithGoogle = async () => {
  if (isMockMode) {
    const mockUser = {
      uid: 'mock-user-123',
      displayName: '測試管理員 (Mock)',
      email: 'mock@example.com',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marco'
    };
    localStorage.setItem('live_poll_mock_user', JSON.stringify(mockUser));
    window.dispatchEvent(new Event('mock_auth_changed'));
    return mockUser;
  }
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};

export const logoutUser = async () => {
  if (isMockMode) {
    localStorage.removeItem('live_poll_mock_user');
    window.dispatchEvent(new Event('mock_auth_changed'));
    return;
  }
  await signOut(auth);
};

export const subscribeAuth = (callback) => {
  if (isMockMode) {
    const checkMockUser = () => {
      const saved = localStorage.getItem('live_poll_mock_user');
      callback(saved ? JSON.parse(saved) : null);
    };
    checkMockUser();
    window.addEventListener('mock_auth_changed', checkMockUser);
    return () => window.removeEventListener('mock_auth_changed', checkMockUser);
  }
  return onAuthStateChanged(auth, callback);
};

// ----------------------------------------------------------------------------
// 📊 Mock Store Helper for Local Storage fallback
// ----------------------------------------------------------------------------
const getMockPolls = () => {
  const data = localStorage.getItem('live_poll_mock_db');
  if (!data) {
    // 預設提供一則示範投票卡片
    const defaultPolls = {
      'demo-poll-1': {
        id: 'demo-poll-1',
        title: '團隊下週午餐想吃什麼？',
        description: '歡迎大家即時參與投票！',
        options: [
          { id: 'opt-1', text: '日式拉麵 🍜', votes: 4 },
          { id: 'opt-2', text: '韓式炸雞 🍗', votes: 6 },
          { id: 'opt-3', text: '義大利麵 🍝', votes: 3 }
        ],
        allowMultiple: false,
        showResultsBeforeVote: true,
        hasTimeLimit: false,
        expiresAt: null,
        totalVotes: 13,
        creatorId: 'mock-user-123',
        creatorName: '測試發起人',
        voterIds: ['mock-voter-prev'],
        createdAt: new Date().toISOString()
      }
    };
    localStorage.setItem('live_poll_mock_db', JSON.stringify(defaultPolls));
    return defaultPolls;
  }
  return JSON.parse(data);
};

const saveMockPolls = (polls) => {
  localStorage.setItem('live_poll_mock_db', JSON.stringify(polls));
  window.dispatchEvent(new Event('mock_db_changed'));
};

// ----------------------------------------------------------------------------
// 🗳️ Firestore Operations (投票資料操作)
// ----------------------------------------------------------------------------

// 1. 建立投票
export const createPollDoc = async (pollData) => {
  if (isMockMode) {
    const polls = getMockPolls();
    const pollId = 'poll-' + Math.random().toString(36).substring(2, 9);
    const newPoll = {
      id: pollId,
      ...pollData,
      totalVotes: 0,
      voterIds: [],
      createdAt: new Date().toISOString()
    };
    polls[pollId] = newPoll;
    saveMockPolls(polls);
    return pollId;
  }

  const pollRef = doc(collection(db, 'polls'));
  const newPoll = {
    id: pollRef.id,
    ...pollData,
    totalVotes: 0,
    voterIds: [],
    createdAt: serverTimestamp()
  };
  await setDoc(pollRef, newPoll);
  return pollRef.id;
};

// 2. 進行投票 (原子化更新)
export const submitVote = async (pollId, selectedOptionIds, voterFingerprint) => {
  if (isMockMode) {
    const polls = getMockPolls();
    const poll = polls[pollId];
    if (!poll) throw new Error('Poll not found');

    if (poll.voterIds && poll.voterIds.includes(voterFingerprint)) {
      throw new Error('您已經在此投票中投過票了！');
    }

    poll.options = poll.options.map(opt => {
      if (selectedOptionIds.includes(opt.id)) {
        return { ...opt, votes: opt.votes + 1 };
      }
      return opt;
    });
    poll.totalVotes += selectedOptionIds.length;
    poll.voterIds = [...(poll.voterIds || []), voterFingerprint];
    polls[pollId] = poll;
    saveMockPolls(polls);
    return poll;
  }

  const pollRef = doc(db, 'polls', pollId);
  await runTransaction(db, async (transaction) => {
    const sfDoc = await transaction.get(pollRef);
    if (!sfDoc.exists()) {
      throw new Error("Poll does not exist!");
    }

    const data = sfDoc.data();
    if (data.voterIds && data.voterIds.includes(voterFingerprint)) {
      throw new Error("您已經參與過此項投票！");
    }

    const updatedOptions = data.options.map(opt => {
      if (selectedOptionIds.includes(opt.id)) {
        return { ...opt, votes: (opt.votes || 0) + 1 };
      }
      return opt;
    });

    const updatedVoterIds = [...(data.voterIds || []), voterFingerprint];
    const newTotalVotes = (data.totalVotes || 0) + selectedOptionIds.length;

    transaction.update(pollRef, {
      options: updatedOptions,
      voterIds: updatedVoterIds,
      totalVotes: newTotalVotes
    });
  });
};

// 3. 訂閱單一投票內容 (Real-time Live Listener)
export const subscribePoll = (pollId, callback) => {
  if (isMockMode) {
    const handleMockSync = () => {
      const polls = getMockPolls();
      callback(polls[pollId] || null);
    };
    handleMockSync();
    window.addEventListener('mock_db_changed', handleMockSync);
    return () => window.removeEventListener('mock_db_changed', handleMockSync);
  }

  const pollRef = doc(db, 'polls', pollId);
  return onSnapshot(pollRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() });
    } else {
      callback(null);
    }
  });
};

// 4. 取得使用者建立的所有投票
export const subscribeUserPolls = (userId, callback) => {
  if (isMockMode) {
    const handleMockSync = () => {
      const polls = getMockPolls();
      const userPolls = Object.values(polls).filter(p => p.creatorId === userId);
      callback(userPolls);
    };
    handleMockSync();
    window.addEventListener('mock_db_changed', handleMockSync);
    return () => window.removeEventListener('mock_db_changed', handleMockSync);
  }

  const q = query(
    collection(db, 'polls'), 
    where('creatorId', '==', userId)
  );
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Sort in memory to avoid requiring Firestore composite index
    list.sort((a, b) => {
      const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
      const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
    callback(list);
  }, (err) => {
    console.error("subscribeUserPolls error:", err);
    callback([]);
  });
};

// 5. 刪除投票
export const deletePollDoc = async (pollId) => {
  if (isMockMode) {
    const polls = getMockPolls();
    delete polls[pollId];
    saveMockPolls(polls);
    return;
  }
  await deleteDoc(doc(db, 'polls', pollId));
};

// 6. 手動關閉/截止投票
export const closePollDoc = async (pollId) => {
  if (isMockMode) {
    const polls = getMockPolls();
    if (polls[pollId]) {
      polls[pollId].isClosed = true;
      polls[pollId].closedAt = new Date().toISOString();
      saveMockPolls(polls);
    }
    return;
  }
  const pollRef = doc(db, 'polls', pollId);
  await updateDoc(pollRef, {
    isClosed: true,
    closedAt: serverTimestamp()
  });
};

// 7. 編輯/更新投票內容
export const updatePollDoc = async (pollId, updatedData) => {
  if (isMockMode) {
    const polls = getMockPolls();
    if (polls[pollId]) {
      polls[pollId] = {
        ...polls[pollId],
        ...updatedData
      };
      saveMockPolls(polls);
    }
    return;
  }
  const pollRef = doc(db, 'polls', pollId);
  await updateDoc(pollRef, updatedData);
};

