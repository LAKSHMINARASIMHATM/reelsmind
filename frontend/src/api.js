// API service layer — all backend communication
const BASE = import.meta.env.VITE_API_URL || '';

const api = {
  async getProfiles() {
    const r = await fetch(`${BASE}/api/profiles`);
    if (!r.ok) throw new Error('Failed to fetch profiles');
    return r.json();
  },

  async login(username, password) {
    const r = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const res = await r.json();
    if (!r.ok) throw new Error(res.error || 'Authentication failed');
    return res;
  },

  async register(username, email, password, fullName) {
    const r = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, full_name: fullName }),
    });
    const res = await r.json();
    if (!r.ok) throw new Error(res.error || 'Registration failed');
    return res;
  },

  async getUsers() {
    const r = await fetch(`${BASE}/api/auth/users`);
    if (!r.ok) throw new Error('Failed to fetch demo users');
    return r.json();
  },

  async getSuggestedAccounts() {
    const r = await fetch(`${BASE}/api/suggested_accounts`);
    if (!r.ok) throw new Error('Failed to fetch suggested accounts');
    return r.json();
  },

  async getReels(profileId = null) {
    const url = profileId ? `${BASE}/api/reels/${profileId}` : `${BASE}/api/reels`;
    const r = await fetch(url);
    if (!r.ok) throw new Error('Failed to fetch reels');
    return r.json();
  },

  async analyzeProfile(profileId) {
    const r = await fetch(`${BASE}/api/analyze/${profileId}`);
    if (!r.ok) throw new Error(`Failed to analyze profile ${profileId}`);
    return r.json();
  },

  async analyzeReels(reels, profileId = null) {
    const r = await fetch(`${BASE}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reels, profile_id: profileId }),
    });
    if (!r.ok) throw new Error('Failed to analyze reels');
    return r.json();
  },

  async runValidation() {
    const r = await fetch(`${BASE}/api/validate`, { method: 'POST' });
    if (!r.ok) throw new Error('Validation failed');
    return r.json();
  },

  async getCandidates() {
    const r = await fetch(`${BASE}/api/candidates`);
    if (!r.ok) throw new Error('Failed to fetch candidates');
    return r.json();
  },

  async getVideos() {
    const r = await fetch(`${BASE}/api/videos`);
    if (!r.ok) throw new Error('Failed to fetch video pool');
    return r.json();
  },
};

export default api;
