// Anonymous Voter Device ID & Local Vote Tracker Helper

const VOTER_ID_KEY = 'live_poll_voter_device_id';
const LOCAL_VOTES_KEY = 'live_poll_user_voted_history';

/**
 * 取得或產生當前裝置唯一的匿名標識碼
 */
export const getVoterDeviceId = () => {
  let deviceId = localStorage.getItem(VOTER_ID_KEY);
  if (!deviceId) {
    deviceId = 'voter_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem(VOTER_ID_KEY, deviceId);
  }
  return deviceId;
};

/**
 * 檢查使用者在當前瀏覽器是否已對指定 Poll 投過票
 */
export const hasVotedLocally = (pollId) => {
  try {
    const history = JSON.parse(localStorage.getItem(LOCAL_VOTES_KEY) || '{}');
    return Boolean(history[pollId]);
  } catch {
    return false;
  }
};

/**
 * 紀錄使用者投票選項至 LocalStorage
 */
export const recordLocalVote = (pollId, optionIds) => {
  try {
    const history = JSON.parse(localStorage.getItem(LOCAL_VOTES_KEY) || '{}');
    history[pollId] = {
      votedAt: new Date().toISOString(),
      optionIds: Array.isArray(optionIds) ? optionIds : [optionIds]
    };
    localStorage.setItem(LOCAL_VOTES_KEY, JSON.stringify(history));
  } catch (err) {
    console.error('Failed to record local vote:', err);
  }
};
