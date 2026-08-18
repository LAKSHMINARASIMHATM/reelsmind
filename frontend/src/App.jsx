import { useState, useEffect, useCallback } from 'react';
import api from './api';
import LoginPage from './components/LoginPage';
import DashboardView from './components/DashboardView';
import ProfileView from './components/ProfileView';
import ReelFeed from './components/ReelFeed';
import { InterestProfilePanel, BehavioralSignals } from './components/InterestProfile';
import { RecommendationCard, RejectedCard } from './components/RecommendationCard';
import { EngagementBarChart, InterestRadarChart, SignalsAreaChart, DomainScoreChart } from './components/Charts';
import { GlassCard, SectionTitle, LoadingSpinner, EmptyState, ProcessingBadge } from './components/UI';
import InterestGraph from './components/InterestGraph';
import ValidationPanel from './components/ValidationPanel';
import AgentOutputView from './components/AgentOutputView';
import './index.css';

const TABS = [
  { id: 'dashboard',   icon: '🏠', label: 'Home' },
  { id: 'reels',       icon: '🎬', label: 'Reels' },
  { id: 'profile',     icon: '👤', label: 'Profile' },
  { id: 'output_spec', icon: '📋', label: 'Agent Output' },
  { id: 'overview',    icon: '🧠', label: 'AI Profile' },
  { id: 'analytics',  icon: '📊', label: 'Analytics' },
  { id: 'recs',       icon: '🎯', label: 'Recommendations' },
  { id: 'graph',      icon: '🕸',  label: 'Interest Graph' },
  { id: 'validation', icon: '✅', label: 'Validation' },
];

export default function App() {
  const [currentUser, setCurrentUser]   = useState(() => {
    try {
      const saved = localStorage.getItem('reelmind_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [profiles, setProfiles]         = useState([]);
  const [activeProfile, setActiveProfile] = useState('P001');
  const [data, setData]                 = useState(null);
  const [rawReels, setRawReels]         = useState([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  const [activeTab, setActiveTab]       = useState('dashboard');

  // Sync profile_id from current user if present
  useEffect(() => {
    if (currentUser?.profile_id) {
      setActiveProfile(currentUser.profile_id);
    }
  }, [currentUser]);

  // Load profiles on mount
  useEffect(() => {
    api.getProfiles().then(d => {
      setProfiles(d.profiles || []);
    }).catch(() => setError('Cannot connect to backend server. Is python main.py running on port 8000?'));
  }, []);

  // Fetch analysis & reels when active profile changes
  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);

    Promise.all([
      api.analyzeProfile(activeProfile).catch(() => null),
      api.getReels(activeProfile).catch(() => api.getReels())
    ]).then(([analysisRes, reelsRes]) => {
      let list = reelsRes?.reels || [];
      if (list.length === 0) {
        api.getReels().then(allD => {
          if (analysisRes) setData(analysisRes);
          setRawReels(allD.reels || []);
          setLoading(false);
        });
      } else {
        if (analysisRes) setData(analysisRes);
        setRawReels(list);
        setLoading(false);
      }
    }).catch(e => {
      setError(e.message);
      setLoading(false);
    });
  }, [activeProfile, currentUser]);

  // Real-time update handler when user interacts with Reels/Posts
  const handleLiveInteractionUpdate = useCallback((updatedReels) => {
    setRawReels(updatedReels);
    api.analyzeReels(updatedReels, activeProfile)
      .then(analysisRes => {
        setData(analysisRes);
      })
      .catch(err => console.error("Live analysis update error:", err));
  }, [activeProfile]);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('reelmind_user', JSON.stringify(user));
    } catch (e) {}
    if (user.profile_id) {
      setActiveProfile(user.profile_id);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('reelmind_user');
    } catch (e) {}
  };

  // If user is not authenticated, render Login Page
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const currentProfile = profiles.find(p => p.profile_id === activeProfile);

  return (
    <div className="app-layout">
      
      {/* ─── INSTAGRAM SIDEBAR (Desktop / Tablet Navigation) ─── */}
      <aside className="sidebar">
        {/* Instagram Logo */}
        <div className="ig-logo-container">
          <span style={{ fontSize: 24 }}>📷</span>
          <div>
            <div className="ig-logo-text">Instagram</div>
            <div className="ig-logo-sub">ReelMind AI</div>
          </div>
        </div>

        {/* Primary Navigation items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 20 }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`ig-nav-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="nav-icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* User Snippet & Logout in Sidebar */}
        <div style={{ marginTop: 'auto', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: 10, borderRadius: 12, background: 'var(--ig-surface)',
            border: '1px solid var(--ig-border)'
          }}>
            <img
              src={currentUser.avatar}
              alt=""
              style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser.username}
              </div>
              <div style={{ fontSize: 10, color: 'var(--ig-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser.full_name}
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{ background: 'none', border: 'none', color: 'var(--ig-red)', fontSize: 13, cursor: 'pointer' }}
              title="Log Out"
            >
              🚪
            </button>
          </div>

          {/* Latency badge */}
          {data && (
            <div style={{ background: 'var(--ig-surface)', border: '1px solid var(--ig-border)', borderRadius: 12, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: 'var(--ig-text-muted)' }}>Latency</span>
              <ProcessingBadge seconds={data.processing_time_seconds} />
            </div>
          )}
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA ─── */}
      <main className="main-content">
        
        {/* Error Banner */}
        {error && (
          <GlassCard noHover style={{ padding: '14px 18px', marginBottom: 20, border: '1px solid var(--ig-red)', background: 'rgba(255,48,64,0.08)' }}>
            <div style={{ color: 'var(--ig-red)', fontWeight: 600, fontSize: 13 }}>⚠ {error}</div>
          </GlassCard>
        )}

        {loading && <LoadingSpinner text="Analyzing Instagram feed & behavioral signals..." />}

        {!loading && data && (
          <>
            {/* ── 1. MAIN DASHBOARD FEED PAGE ── */}
            {activeTab === 'dashboard' && (
              <DashboardView
                user={currentUser}
                reels={rawReels}
                onSwitchUser={handleLogout}
                onInteractionUpdate={handleLiveInteractionUpdate}
                currentAnalysis={data}
              />
            )}

            {/* ── 2. VERTICAL REELS SCROLL FEED PAGE ── */}
            {activeTab === 'reels' && (
              <div style={{ marginBottom: 32 }}>
                <SectionTitle>🎬 Instagram Short-Form Reels Feed</SectionTitle>
                <ReelFeed
                  initialReels={rawReels}
                  onInteractionUpdate={handleLiveInteractionUpdate}
                  currentAnalysis={data}
                />
              </div>
            )}

            {/* ── 3. USER PROFILE PAGE ── */}
            {activeTab === 'profile' && (
              <ProfileView
                user={currentUser}
                reels={rawReels}
                analysisData={data}
                onSelectReel={() => setActiveTab('reels')}
              />
            )}

            {/* ── 3.5 AGENT STRUCTURED OUTPUT SPEC PAGE ── */}
            {activeTab === 'output_spec' && (
              <div style={{ marginBottom: 32 }}>
                <SectionTitle>📋 Required Agent Output Schema View</SectionTitle>
                <AgentOutputView data={data} />
              </div>
            )}

            {/* ── 4. AI LATENT INTEREST PROFILE TAB ── */}
            {activeTab === 'overview' && (
              <div style={{ marginBottom: 32 }}>
                <SectionTitle>Student Latent Interest Profile</SectionTitle>
                <InterestProfilePanel profile={data.interest_profile} />
                <div style={{ marginTop: 24 }}>
                  <SectionTitle>Behavioral Signal Breakdown</SectionTitle>
                  <GlassCard noHover style={{ padding: 20 }}>
                    <BehavioralSignals evidence={data.interest_profile?.primary_interest?.behavioral_evidence} />
                  </GlassCard>
                </div>
              </div>
            )}

            {/* ── 5. ANALYTICS TAB ── */}
            {activeTab === 'analytics' && (
              <div style={{ marginBottom: 32 }}>
                <SectionTitle>Instagram Reel Engagement Analytics</SectionTitle>
                <div className="charts-grid">
                  <EngagementBarChart data={data.engagement_analytics} />
                  <InterestRadarChart interests={[
                    data.interest_profile?.primary_interest,
                    ...(data.interest_profile?.secondary_interests || []),
                  ].filter(Boolean)} />
                  <SignalsAreaChart data={data.engagement_analytics} />
                  <DomainScoreChart normalized={
                    data.reel_representations?.reduce((acc, r) => {
                      r.latent_domains?.forEach(d => { acc[d] = (acc[d] || 0) + r.behavioral_score * 100; });
                      return acc;
                    }, {})
                  } />
                </div>
              </div>
            )}

            {/* ── 6. RECOMMENDATIONS TAB ── */}
            {activeTab === 'recs' && (
              <div style={{ marginBottom: 32 }}>
                <SectionTitle>Personalized Educational Recommendations</SectionTitle>
                {data.recommendations?.length ? (
                  data.recommendations.map((rec, i) => (
                    <RecommendationCard key={rec.rank} rec={rec} index={i} />
                  ))
                ) : (
                  <EmptyState icon="🎯" text="No strong technology interest detected — try a tech-focused profile or scroll tech reels" />
                )}

                {data.rejected_candidates?.length > 0 && (
                  <div style={{ marginTop: 32 }}>
                    <SectionTitle>🚫 Rejected Content (Hype Filter)</SectionTitle>
                    {data.rejected_candidates.map((item, i) => (
                      <RejectedCard key={i} item={item} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── 7. INTEREST GRAPH TAB ── */}
            {activeTab === 'graph' && (
              <div style={{ marginBottom: 32 }}>
                <SectionTitle>Interest Graph (Thematic Hierarchy)</SectionTitle>
                <InterestGraph graphData={data.interest_graph} />
              </div>
            )}

            {/* ── 8. VALIDATION TAB ── */}
            {activeTab === 'validation' && (
              <div style={{ marginBottom: 32 }}>
                <SectionTitle>Automated Validation Suite</SectionTitle>
                <ValidationPanel />
              </div>
            )}
          </>
        )}

      </main>
    </div>
  );
}
