import { useState } from 'react';
import { GlassCard, ScoreBar, ConfidenceChip, CategoryChip } from './UI';
import { InterestProfilePanel, BehavioralSignals } from './InterestProfile';
import { InterestRadarChart } from './Charts';

export default function ProfileView({ user, reels, analysisData, onSelectReel }) {
  const [profileTab, setProfileTab] = useState('posts');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState(user?.bio || "💻 Aspiring Software Engineer | Tech Reels & AI Explorer 🚀");
  const [fullName, setFullName] = useState(user?.full_name || "Alex Rivers | SWE");
  const [website, setWebsite] = useState(user?.website || "https://github.com/alex-dev");
  const [followersCount, setFollowersCount] = useState(user?.followers_count || 14200);

  if (!user) return null;

  const savedReels = reels ? reels.filter(r => r.saved) : [];
  const primaryInterest = analysisData?.interest_profile?.primary_interest;
  const skillLevel = analysisData?.interest_profile?.skill_level || 'Intermediate';

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'k';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', width: '100%' }}>
      
      {/* ─── INSTAGRAM PROFILE HEADER ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '180px 1fr',
        gap: 32,
        alignItems: 'center',
        paddingBottom: 32,
        borderBottom: '1px solid var(--ig-border)',
        marginBottom: 24,
      }}>
        
        {/* Large Avatar with Instagram Story Ring Gradient */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: 130, height: 130, borderRadius: '50%', padding: 3,
            background: 'var(--ig-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(220,39,67,0.3)',
          }}>
            <img
              src={user.avatar}
              alt={user.username}
              style={{
                width: '100%', height: '100%', borderRadius: '50%',
                objectFit: 'cover', border: '3px solid var(--ig-black)',
              }}
            />
          </div>
        </div>

        {/* Profile Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Username + Edit Buttons Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--ig-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
              {user.username}
              <span style={{ color: 'var(--ig-blue)', fontSize: 16 }}>✓</span>
            </span>

            <button
              onClick={() => setIsEditingBio(true)}
              style={{
                padding: '7px 16px', borderRadius: 8,
                background: 'var(--ig-card)', border: '1px solid var(--ig-border-light)',
                color: 'var(--ig-text)', fontWeight: 600, fontSize: 13,
                cursor: 'pointer', transition: 'background 0.15s ease',
              }}
            >
              Edit profile
            </button>

            <button
              onClick={() => setProfileTab('saved')}
              style={{
                padding: '7px 16px', borderRadius: 8,
                background: 'var(--ig-card)', border: '1px solid var(--ig-border-light)',
                color: 'var(--ig-text)', fontWeight: 600, fontSize: 13,
                cursor: 'pointer',
              }}
            >
              View Saved
            </button>

            <span style={{ fontSize: 18, color: 'var(--ig-text-secondary)', cursor: 'pointer' }}>⚙️</span>
          </div>

          {/* Followers / Following / Posts Stats Row */}
          <div style={{ display: 'flex', gap: 32, fontSize: 14 }}>
            <div>
              <strong style={{ color: 'var(--ig-text)', fontWeight: 700 }}>{reels?.length || user.posts_count || 12}</strong>{' '}
              <span style={{ color: 'var(--ig-text-secondary)' }}>posts</span>
            </div>

            <div>
              <strong style={{ color: 'var(--ig-text)', fontWeight: 700 }}>{formatNumber(followersCount)}</strong>{' '}
              <span style={{ color: 'var(--ig-text-secondary)' }}>followers</span>
            </div>

            <div>
              <strong style={{ color: 'var(--ig-text)', fontWeight: 700 }}>{user.following_count || 482}</strong>{' '}
              <span style={{ color: 'var(--ig-text-secondary)' }}>following</span>
            </div>
          </div>

          {/* Bio Section */}
          <div style={{ fontSize: 13, lineHeight: 1.5 }}>
            <div style={{ fontWeight: 700, color: 'var(--ig-text)' }}>{fullName}</div>
            <div style={{ color: 'var(--ig-text-secondary)', whiteSpace: 'pre-line', margin: '4px 0' }}>
              {bioText}
            </div>
            {website && (
              <a
                href={website}
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--ig-blue)', fontWeight: 600, textDecoration: 'none' }}
              >
                🔗 {website.replace('https://', '')}
              </a>
            )}
          </div>

          {/* AI Latent Interest Summary Pill */}
          {primaryInterest && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '8px 14px', borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(157,78,221,0.15), rgba(0,210,255,0.15))',
              border: '1px solid rgba(157,78,221,0.3)',
              width: 'fit-content',
            }}>
              <span style={{ fontSize: 14 }}>🧠</span>
              <div style={{ fontSize: 11 }}>
                <span style={{ color: 'var(--ig-text-muted)' }}>AI Detected Interest: </span>
                <strong style={{ color: 'var(--accent-purple)' }}>{primaryInterest.interest_name}</strong>
                <span style={{ color: 'var(--ig-text-muted)', marginLeft: 8 }}>Skill: </span>
                <strong style={{ color: 'var(--accent-cyan)' }}>{skillLevel}</strong>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Story Highlights Circles */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 28, overflowX: 'auto', paddingBottom: 8 }}>
        {[
          { label: 'System Design', icon: '🏗️' },
          { label: 'RAG AI', icon: '🤖' },
          { label: 'DSA Prep', icon: '💻' },
          { label: 'Hardware', icon: '💻' },
          { label: 'Highlights', icon: '⭐' },
        ].map((h, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <div style={{
              width: 58, height: 58, borderRadius: '50%',
              background: 'var(--ig-surface)', border: '1px solid var(--ig-border-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22,
            }}>
              {h.icon}
            </div>
            <span style={{ fontSize: 11, color: 'var(--ig-text-secondary)', fontWeight: 600 }}>{h.label}</span>
          </div>
        ))}
      </div>

      {/* Profile Navigation Tabs (Instagram style) */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 48,
        borderTop: '1px solid var(--ig-border)', marginBottom: 24,
      }}>
        {[
          { id: 'posts', icon: '▦', label: 'POSTS' },
          { id: 'reels', icon: '🎬', label: 'REELS' },
          { id: 'ai',    icon: '🧠', label: 'AI PROFILE' },
          { id: 'saved', icon: '🔖', label: 'SAVED' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setProfileTab(t.id)}
            style={{
              background: 'none', border: 'none',
              borderTop: profileTab === t.id ? '1px solid white' : '1px solid transparent',
              color: profileTab === t.id ? 'white' : 'var(--ig-text-muted)',
              padding: '12px 0', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', letterSpacing: '0.1em',
              display: 'flex', alignItems: 'center', gap: 6,
              marginTop: -1,
            }}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* ─── TAB CONTENT ─── */}

      {/* 1. POSTS GRID (3-column Instagram Grid) */}
      {profileTab === 'posts' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {reels?.map((reel, idx) => (
            <div
              key={reel.reel_id}
              onClick={() => onSelectReel && onSelectReel(idx)}
              style={{
                aspectRatio: '1/1',
                background: reel.is_entertainment
                  ? 'radial-gradient(circle at 50% 30%, #2b0b30 0%, #08040a 80%)'
                  : 'radial-gradient(circle at 50% 30%, #0b2238 0%, #03080f 80%)',
                borderRadius: 8,
                border: '1px solid var(--ig-border)',
                padding: 14,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                cursor: 'pointer',
                overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: 'rgba(0,0,0,0.6)', color: 'white', fontWeight: 700 }}>
                  🎬 Post #{idx+1}
                </span>
                <span style={{ fontSize: 10, color: 'var(--ig-cyan)', fontWeight: 700 }}>
                  {reel.category}
                </span>
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'white', lineHeight: 1.3, marginBottom: 6 }}>
                  {reel.title}
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 10, color: 'var(--ig-text-secondary)' }}>
                  <span>❤️ {reel.liked ? '1.8k' : '1.2k'}</span>
                  <span>💬 {reel.comment_count || 120}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. REELS FEED */}
      {profileTab === 'reels' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {reels?.map((reel, idx) => (
            <div
              key={reel.reel_id}
              onClick={() => onSelectReel && onSelectReel(idx)}
              style={{
                aspectRatio: '9/16',
                background: 'radial-gradient(circle at 50% 30%, #150a2e 0%, #05030d 80%)',
                borderRadius: 12,
                border: '1px solid var(--ig-border)',
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <CategoryChip category={reel.category} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'white', marginBottom: 4 }}>
                  {reel.title}
                </div>
                <div style={{ fontSize: 10, color: 'var(--ig-text-muted)' }}>
                  ▶ {reel.duration_seconds}s · {reel.watch_percentage}% Watched
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. AI PROFILE */}
      {profileTab === 'ai' && analysisData?.interest_profile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <InterestProfilePanel profile={analysisData.interest_profile} />
          <GlassCard noHover style={{ padding: 20 }}>
            <BehavioralSignals evidence={analysisData.interest_profile?.primary_interest?.behavioral_evidence} />
          </GlassCard>
        </div>
      )}

      {/* 4. SAVED */}
      {profileTab === 'saved' && (
        <div>
          {savedReels.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {savedReels.map((reel, idx) => (
                <div
                  key={reel.reel_id}
                  style={{
                    aspectRatio: '1/1',
                    background: 'radial-gradient(circle at 50% 30%, #0b2238 0%, #03080f 80%)',
                    borderRadius: 10, border: '1px solid var(--ig-border)', padding: 14,
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: 10, color: 'var(--ig-cyan)', fontWeight: 700 }}>🔖 Saved</span>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>{reel.title}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textCenter: 'center', padding: 48, color: 'var(--ig-text-muted)' }}>
              No saved reels yet. Tap 🔖 on any Reel to save it!
            </div>
          )}
        </div>
      )}

      {/* Edit Bio Modal Dialog */}
      {isEditingBio && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{
            background: 'var(--ig-surface)', border: '1px solid var(--ig-border-light)',
            borderRadius: 16, width: '100%', maxWidth: 450, padding: 24,
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ig-text)', marginBottom: 16 }}>
              Edit Instagram Profile
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--ig-text-muted)', display: 'block', marginBottom: 4 }}>Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 8,
                    background: 'var(--ig-black)', border: '1px solid var(--ig-border)',
                    color: 'white', fontSize: 13, fontFamily: 'inherit',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--ig-text-muted)', display: 'block', marginBottom: 4 }}>Bio</label>
                <textarea
                  rows={3}
                  value={bioText}
                  onChange={(e) => setBioText(e.target.value)}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 8,
                    background: 'var(--ig-black)', border: '1px solid var(--ig-border)',
                    color: 'white', fontSize: 12, fontFamily: 'inherit', resize: 'vertical',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--ig-text-muted)', display: 'block', marginBottom: 4 }}>Website</label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 8,
                    background: 'var(--ig-black)', border: '1px solid var(--ig-border)',
                    color: 'white', fontSize: 13, fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button
                onClick={() => setIsEditingBio(false)}
                style={{
                  padding: '8px 16px', borderRadius: 8,
                  background: 'none', border: '1px solid var(--ig-border)',
                  color: 'var(--ig-text-muted)', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => setIsEditingBio(false)}
                style={{
                  padding: '8px 16px', borderRadius: 8,
                  background: 'var(--ig-blue)', border: 'none',
                  color: 'white', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
