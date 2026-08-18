import { useState, useEffect, useRef } from 'react';
import VideoPlayer from './VideoPlayer';
import { GlassCard, CategoryChip, ScoreBar } from './UI';
import api from '../api';

// ─── Scrolling Mode Definitions ──────────────────────────────────────────────
const SCROLL_MODES = [
  { id: 'vertical',    icon: '📱', label: 'Snap Scroll',  desc: 'TikTok-style snap' },
  { id: 'horizontal',  icon: '➡️', label: 'Carousel',     desc: 'Horizontal swipe' },
  { id: 'grid',        icon: '⊞',  label: 'Grid Mosaic',  desc: '2-column grid' },
  { id: 'coverflow',   icon: '🎠', label: 'Coverflow',    desc: '3D cover flow' },
  { id: 'timeline',    icon: '📋', label: 'Timeline',     desc: 'Scrollable list' },
];

export default function ReelFeed({ initialReels, onInteractionUpdate, currentAnalysis }) {
  const [reels, setReels]           = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying]   = useState(true);
  const [isMuted, setIsMuted]       = useState(true);
  const [isFollowing, setIsFollowing] = useState({});
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentSentiment, setCommentSentiment] = useState('positive');
  const [showHeartPop, setShowHeartPop] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [scrollMode, setScrollMode] = useState('vertical');
  const scrollRef = useRef(null);

  const formatReelsData = (list) => list.map(r => ({
    ...r,
    liked: Boolean(r.liked),
    saved: Boolean(r.saved),
    shared: Boolean(r.shared),
    rewatched: Boolean(r.rewatched),
    watch_percentage: r.watch_percentage ?? 90,
    commented: Boolean(r.commented),
    comment_sentiment: r.comment_sentiment || 'positive',
    comments_list: r.comments_list || [
      { author: 'alex_dev', text: 'Insanely accurate breakdown! Applied this today.' },
      { author: 'code_newbie', text: 'Finally understand this concept!' },
    ],
  }));

  useEffect(() => {
    if (initialReels && initialReels.length > 0) {
      setReels(formatReelsData(initialReels));
    } else {
      api.getReels()
        .then(d => { if (d.reels?.length) setReels(formatReelsData(d.reels)); })
        .catch(err => console.error('Failed to load reels:', err));
    }
  }, [initialReels]);

  const activeReel = reels[activeIndex] || null;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2400);
  };

  const goTo = (idx) => {
    const clamped = Math.max(0, Math.min(reels.length - 1, idx));
    setActiveIndex(clamped);
    setIsPlaying(true);
  };

  const handleDoubleTap = () => {
    setShowHeartPop(true);
    setTimeout(() => setShowHeartPop(false), 850);
    if (activeReel && !activeReel.liked) toggleLike(activeIndex);
  };

  const toggleLike = (i) => {
    const u = [...reels];
    u[i].liked = !u[i].liked;
    u[i].like_count = (u[i].like_count || 50000) + (u[i].liked ? 1 : -1);
    setReels(u);
    showToast(u[i].liked ? '❤️ Added to Liked Reels' : 'Removed from Liked Reels');
    if (onInteractionUpdate) onInteractionUpdate(u);
  };

  const toggleSave = (i) => {
    const u = [...reels];
    u[i].saved = !u[i].saved;
    setReels(u);
    showToast(u[i].saved ? '🔖 Saved to Collection' : 'Removed from Saved');
    if (onInteractionUpdate) onInteractionUpdate(u);
  };

  const toggleShare = (i) => {
    const u = [...reels];
    u[i].shared = !u[i].shared;
    u[i].share_count = (u[i].share_count || 10000) + (u[i].shared ? 1 : -1);
    setReels(u);
    showToast(u[i].shared ? '✈️ Reel link copied!' : 'Unshared');
    if (onInteractionUpdate) onInteractionUpdate(u);
  };

  const setWatchPercentage = (i, pct) => {
    const u = [...reels];
    u[i].watch_percentage = pct;
    u[i].watch_duration_seconds = Math.round((pct / 100) * (u[i].duration_seconds || 30));
    setReels(u);
    showToast(`⏱️ Watch ${pct}%`);
    if (onInteractionUpdate) onInteractionUpdate(u);
  };

  const toggleFollow = (username) => {
    setIsFollowing(prev => {
      const next = { ...prev, [username]: !prev[username] };
      showToast(next[username] ? `Following ${username}` : `Unfollowed ${username}`);
      return next;
    });
  };

  const addComment = (e) => {
    e.preventDefault();
    if (!newComment.trim() || !activeReel) return;
    const u = [...reels];
    u[activeIndex].commented = true;
    u[activeIndex].comment_sentiment = commentSentiment;
    u[activeIndex].comments_list = u[activeIndex].comments_list || [];
    u[activeIndex].comments_list.unshift({ author: 'you', text: newComment, sentiment: commentSentiment });
    u[activeIndex].comment_count = (u[activeIndex].comment_count || 1000) + 1;
    setNewComment('');
    setReels(u);
    showToast('💬 Comment posted!');
    if (onInteractionUpdate) onInteractionUpdate(u);
  };

  const formatNumber = (n) => {
    if (!n) return '0';
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000)    return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  };

  if (!reels || reels.length === 0) {
    return (
      <GlassCard noHover style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🎬</div>
        <div style={{ fontWeight: 700, fontSize: 16 }}>Loading Reels Feed...</div>
      </GlassCard>
    );
  }

  const currentUsername = activeReel?.author_username || '@tech_creator';
  const followingState = Boolean(isFollowing[currentUsername]);

  // ─── Shared Action Bar Component ─────────────────────────────────────────
  const ActionBar = ({ index, reel, compact = false }) => (
    <div style={{
      display: 'flex',
      flexDirection: compact ? 'row' : 'column',
      alignItems: 'center',
      gap: compact ? 12 : 6,
    }}>
      {[
        { icon: reel.liked ? '❤️' : '🤍', count: formatNumber(reel.like_count || 50000), fn: () => toggleLike(index), active: reel.liked },
        { icon: '💬', count: formatNumber(reel.comment_count || 1000), fn: () => { setActiveIndex(index); setShowComments(s => !s); } },
        { icon: '✈️', count: formatNumber(reel.share_count || 10000), fn: () => toggleShare(index) },
        { icon: reel.saved ? '🔖' : '📑', count: reel.saved ? 'Saved' : 'Save', fn: () => toggleSave(index) },
      ].map((btn, bi) => (
        <button
          key={bi}
          onClick={(e) => { e.stopPropagation(); btn.fn(); }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: compact ? 'row' : 'column',
            alignItems: 'center', gap: 2, padding: '4px 6px',
          }}
        >
          <span style={{ fontSize: compact ? 16 : 20 }}>{btn.icon}</span>
          <span style={{ fontSize: 10, color: 'var(--ig-text-secondary)', fontWeight: 600 }}>{btn.count}</span>
        </button>
      ))}
    </div>
  );

  // ─── Mini Reel Card used in Grid & Timeline ───────────────────────────────
  const MiniReelCard = ({ reel, index, isActive }) => (
    <div
      onClick={() => { setActiveIndex(index); setIsPlaying(true); }}
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        cursor: 'pointer',
        border: isActive ? '2px solid var(--ig-blue)' : '1px solid var(--ig-border)',
        transition: 'all 0.25s ease',
        transform: isActive ? 'scale(1.02)' : 'scale(1)',
        boxShadow: isActive ? '0 0 20px rgba(0,149,246,0.4)' : 'none',
        background: '#000',
      }}
    >
      <div style={{ position: 'relative', height: 180 }}>
        <VideoPlayer
          reelId={reel.reel_id}
          videoUrl={reel.video_url}
          isPlaying={isActive && isPlaying}
          isMuted={true}
          onDoubleTap={() => toggleLike(index)}
        />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, padding: '6px 8px',
          background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, transparent 100%)',
        }}>
          <CategoryChip category={reel.category} />
        </div>
      </div>
      <div style={{ padding: '8px 10px', background: 'var(--ig-surface)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'white', lineHeight: 1.3, marginBottom: 4 }}>
          {reel.title?.slice(0, 55)}{reel.title?.length > 55 ? '…' : ''}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ig-text-muted)' }}>
          <span>❤️ {formatNumber(reel.like_count || 50000)}</span>
          <span>{reel.author_username || '@creator'}</span>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: SCROLL MODE SELECTOR BAR
  // ══════════════════════════════════════════════════════════════════════════
  const ScrollModeBar = () => (
    <div style={{
      display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4,
      scrollbarWidth: 'none', marginBottom: 16,
    }}>
      {SCROLL_MODES.map(mode => (
        <button
          key={mode.id}
          onClick={() => setScrollMode(mode.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 24, whiteSpace: 'nowrap',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
            background: scrollMode === mode.id
              ? 'var(--ig-gradient)'
              : 'var(--ig-surface)',
            color: scrollMode === mode.id ? 'white' : 'var(--ig-text-secondary)',
            border: scrollMode === mode.id ? 'none' : '1px solid var(--ig-border)',
            transition: 'all 0.2s ease',
            boxShadow: scrollMode === mode.id ? '0 4px 16px rgba(131,58,180,0.35)' : 'none',
          }}
        >
          <span>{mode.icon}</span>
          <span>{mode.label}</span>
        </button>
      ))}
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // MODE 1: VERTICAL SNAP SCROLL (TikTok / Instagram Reels style)
  // ══════════════════════════════════════════════════════════════════════════
  const VerticalSnapView = () => (
    <div className="ig-reels-feed-container">
      <div style={{ position: 'relative' }}>
        {/* Header */}
        <div style={{
          background: 'var(--ig-surface)', border: '1px solid var(--ig-border)',
          borderRadius: '16px 16px 0 0', padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
            <span style={{ fontSize: 16 }}>🎥</span>
            <span style={{ fontFamily: 'Grand Hotel, cursive', fontSize: 22, background: 'var(--ig-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Reels</span>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button onClick={() => setIsMuted(!isMuted)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: 13 }}>
              {isMuted ? '🔇 Muted' : '🔊 On'}
            </button>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--ig-text-muted)' }}>
              {activeIndex + 1} / {reels.length}
            </span>
          </div>
        </div>

        {/* Video */}
        <div className="ig-reel-card" style={{ borderRadius: '0 0 16px 16px', borderTop: 'none', background: '#000' }}>
          {showHeartPop && <div className="heart-pop-animation">❤️</div>}
          <VideoPlayer reelId={activeReel.reel_id} videoUrl={activeReel.video_url} title={activeReel.title}
            category={activeReel.category} educationalValue={activeReel.educational_value}
            isMuted={isMuted} isPlaying={isPlaying} onDoubleTap={handleDoubleTap} />

          {!isPlaying && (
            <div onClick={() => setIsPlaying(true)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 15 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>▶</div>
            </div>
          )}

          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)', pointerEvents: 'none', zIndex: 5 }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 160, background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, transparent 100%)', pointerEvents: 'none', zIndex: 5 }} />

          {/* Bottom overlay */}
          <div style={{ position: 'absolute', bottom: 20, left: 16, right: 70, zIndex: 10, color: 'white', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', padding: 2, background: 'var(--ig-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#121212', border: '2px solid black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>
                  {currentUsername[1]?.toUpperCase()}
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{currentUsername}</span>
                  <span style={{ color: 'var(--ig-blue)', fontSize: 11 }}>✓</span>
                  <button onClick={(e) => { e.stopPropagation(); toggleFollow(currentUsername); }} style={{ background: followingState ? 'rgba(255,255,255,0.15)' : 'transparent', border: followingState ? 'none' : '1px solid rgba(255,255,255,0.6)', color: 'white', padding: '2px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer', marginLeft: 4 }}>
                    {followingState ? 'Following' : 'Follow'}
                  </button>
                </div>
                <div style={{ fontSize: 10, opacity: 0.8 }}>{activeReel.author_name}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, lineHeight: 1.35 }}>{activeReel.title}</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
              {(activeReel.hashtags || activeReel.topics || []).slice(0, 4).map((tag, idx) => (
                <span key={idx} style={{ fontSize: 10, color: '#e0aaff', fontWeight: 600 }}>{tag.startsWith('#') ? tag : `#${tag}`}</span>
              ))}
            </div>
            <div style={{ fontSize: 11, opacity: 0.9 }}>🎵 {activeReel.music_title || 'original sound'}</div>
          </div>

          {/* Right action sidebar */}
          <div className="ig-actions-sidebar">
            <ActionBar index={activeIndex} reel={activeReel} />
            <div className="audio-disc-spinning" style={{ marginTop: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />
            </div>
          </div>

          {/* Toast */}
          {toastMessage && (
            <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', background: 'rgba(18,18,18,0.95)', border: '1px solid var(--ig-border-light)', color: 'white', padding: '6px 16px', borderRadius: 20, fontSize: 11, fontWeight: 600, zIndex: 40, whiteSpace: 'nowrap' }}>
              {toastMessage}
            </div>
          )}
        </div>

        {/* Nav buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <button onClick={() => goTo(activeIndex - 1)} disabled={activeIndex === 0}
            style={{ flex: 1, padding: 10, borderRadius: 10, background: 'var(--ig-surface)', border: '1px solid var(--ig-border)', color: activeIndex === 0 ? 'var(--ig-text-muted)' : 'white', cursor: activeIndex === 0 ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13 }}>
            ⬆ Previous
          </button>
          <button onClick={() => goTo(activeIndex + 1)} disabled={activeIndex === reels.length - 1}
            style={{ flex: 1, padding: 10, borderRadius: 10, background: 'var(--ig-blue)', border: 'none', color: 'white', cursor: activeIndex === reels.length - 1 ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13 }}>
            Next ⬇
          </button>
        </div>
      </div>

      {/* Right side panel */}
      <RightPanel />
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // MODE 2: HORIZONTAL CAROUSEL
  // ══════════════════════════════════════════════════════════════════════════
  const HorizontalCarouselView = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Main active video */}
      <div style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', height: 400, background: '#000', border: '2px solid var(--ig-blue)', boxShadow: '0 0 30px rgba(0,149,246,0.3)' }}>
        <VideoPlayer reelId={activeReel.reel_id} videoUrl={activeReel.video_url} isMuted={isMuted} isPlaying={isPlaying} onDoubleTap={handleDoubleTap} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, background: 'linear-gradient(0deg, rgba(0,0,0,0.9) 0%, transparent 100%)', zIndex: 5, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 16, left: 16, zIndex: 10, color: 'white' }}>
          <CategoryChip category={activeReel.category} />
          <div style={{ fontWeight: 800, fontSize: 15, marginTop: 6, textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>{activeReel.title?.slice(0, 60)}…</div>
          <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>{activeReel.author_username}</div>
        </div>
        <div style={{ position: 'absolute', right: 16, bottom: 16, zIndex: 10 }}>
          <ActionBar index={activeIndex} reel={activeReel} compact />
        </div>
        {toastMessage && (
          <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', background: 'rgba(18,18,18,0.95)', color: 'white', padding: '6px 16px', borderRadius: 20, fontSize: 11, fontWeight: 600, zIndex: 40, whiteSpace: 'nowrap' }}>
            {toastMessage}
          </div>
        )}
      </div>

      {/* Horizontal strip */}
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
        {reels.map((reel, idx) => (
          <div
            key={reel.reel_id}
            onClick={() => goTo(idx)}
            style={{
              minWidth: 100, height: 140, borderRadius: 14, overflow: 'hidden', cursor: 'pointer', flexShrink: 0,
              border: idx === activeIndex ? '2px solid var(--ig-blue)' : '1px solid var(--ig-border)',
              opacity: idx === activeIndex ? 1 : 0.65,
              transition: 'all 0.2s ease',
              transform: idx === activeIndex ? 'scale(1.08)' : 'scale(1)',
              background: '#000', position: 'relative',
            }}
          >
            <VideoPlayer reelId={reel.reel_id} videoUrl={reel.video_url} isPlaying={false} isMuted={true} />
            <div style={{ position: 'absolute', inset: 0, background: idx === activeIndex ? 'transparent' : 'rgba(0,0,0,0.2)', zIndex: 5 }} />
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center' }}>
        <button onClick={() => goTo(activeIndex - 1)} disabled={activeIndex === 0}
          style={{ padding: '10px 24px', borderRadius: 24, background: 'var(--ig-surface)', border: '1px solid var(--ig-border)', color: 'white', cursor: 'pointer', fontWeight: 700 }}>
          ◀ Prev
        </button>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--ig-text-muted)' }}>
          {activeIndex + 1} / {reels.length}
        </span>
        <button onClick={() => goTo(activeIndex + 1)} disabled={activeIndex === reels.length - 1}
          style={{ padding: '10px 24px', borderRadius: 24, background: 'var(--ig-blue)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 700 }}>
          Next ▶
        </button>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // MODE 3: GRID MOSAIC
  // ══════════════════════════════════════════════════════════════════════════
  const GridMosaicView = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Active video expanded */}
      <div style={{ borderRadius: 20, overflow: 'hidden', height: 320, background: '#000', position: 'relative', border: '2px solid var(--ig-blue)' }}>
        <VideoPlayer reelId={activeReel.reel_id} videoUrl={activeReel.video_url} isMuted={isMuted} isPlaying={isPlaying} onDoubleTap={handleDoubleTap} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, background: 'linear-gradient(0deg, rgba(0,0,0,0.9) 0%, transparent 100%)', pointerEvents: 'none', zIndex: 5 }} />
        <div style={{ position: 'absolute', bottom: 14, left: 14, zIndex: 10 }}>
          <CategoryChip category={activeReel.category} />
          <div style={{ color: 'white', fontWeight: 800, fontSize: 14, marginTop: 4, textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>{activeReel.title?.slice(0, 50)}…</div>
        </div>
        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
          <ActionBar index={activeIndex} reel={activeReel} compact />
        </div>
        {toastMessage && (
          <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', background: 'rgba(18,18,18,0.95)', color: 'white', padding: '6px 16px', borderRadius: 20, fontSize: 11, fontWeight: 600, zIndex: 40, whiteSpace: 'nowrap' }}>
            {toastMessage}
          </div>
        )}
      </div>

      {/* 2-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {reels.map((reel, idx) => (
          <MiniReelCard key={reel.reel_id} reel={reel} index={idx} isActive={idx === activeIndex} />
        ))}
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // MODE 4: COVERFLOW (3D perspective)
  // ══════════════════════════════════════════════════════════════════════════
  const CoverflowView = () => {
    const visibleCount = 5;
    const half = Math.floor(visibleCount / 2);
    const start = Math.max(0, activeIndex - half);
    const end = Math.min(reels.length - 1, start + visibleCount - 1);
    const visible = reels.slice(start, end + 1);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Coverflow strip */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0, height: 320, perspective: '1000px', overflow: 'hidden' }}>
          {visible.map((reel, vi) => {
            const globalIdx = start + vi;
            const offset = globalIdx - activeIndex;
            const isCenter = offset === 0;
            const angle = offset * -35;
            const translateX = offset * 110;
            const scale = isCenter ? 1 : Math.max(0.6, 1 - Math.abs(offset) * 0.18);
            const zIndex = 10 - Math.abs(offset);
            const opacity = isCenter ? 1 : Math.max(0.35, 1 - Math.abs(offset) * 0.3);

            return (
              <div
                key={reel.reel_id}
                onClick={() => goTo(globalIdx)}
                style={{
                  position: 'absolute',
                  width: 180, height: 300,
                  borderRadius: 18, overflow: 'hidden', cursor: 'pointer',
                  transform: `translateX(${translateX}px) rotateY(${angle}deg) scale(${scale})`,
                  transformOrigin: 'center center',
                  transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  zIndex,
                  opacity,
                  border: isCenter ? '2px solid var(--ig-blue)' : '1px solid var(--ig-border)',
                  boxShadow: isCenter ? '0 0 40px rgba(0,149,246,0.5)' : '0 4px 20px rgba(0,0,0,0.5)',
                  background: '#000',
                }}
              >
                <VideoPlayer reelId={reel.reel_id} videoUrl={reel.video_url} isPlaying={isCenter && isPlaying} isMuted={true} />
                {!isCenter && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 5 }} />
                )}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '6px 8px', background: 'linear-gradient(0deg, rgba(0,0,0,0.9) 0%, transparent 100%)', zIndex: 10 }}>
                  <CategoryChip category={reel.category} />
                  <div style={{ fontSize: 9, color: 'white', marginTop: 2, fontWeight: 600 }}>{reel.title?.slice(0, 30)}…</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Active reel details */}
        <GlassCard noHover style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <CategoryChip category={activeReel.category} />
              <div style={{ fontWeight: 800, fontSize: 15, color: 'white', marginTop: 6, lineHeight: 1.3 }}>{activeReel.title}</div>
              <div style={{ fontSize: 11, color: 'var(--ig-text-muted)', marginTop: 4 }}>{activeReel.author_username}</div>
            </div>
            <ActionBar index={activeIndex} reel={activeReel} compact />
          </div>
        </GlassCard>

        {/* Nav */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={() => goTo(activeIndex - 1)} disabled={activeIndex === 0}
            style={{ padding: '10px 28px', borderRadius: 24, background: 'var(--ig-surface)', border: '1px solid var(--ig-border)', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>◀</button>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--ig-text-muted)', alignSelf: 'center' }}>{activeIndex + 1} / {reels.length}</span>
          <button onClick={() => goTo(activeIndex + 1)} disabled={activeIndex === reels.length - 1}
            style={{ padding: '10px 28px', borderRadius: 24, background: 'var(--ig-blue)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>▶</button>
        </div>

        {toastMessage && (
          <div style={{ textAlign: 'center', background: 'rgba(18,18,18,0.95)', color: 'white', padding: '6px 16px', borderRadius: 20, fontSize: 11, fontWeight: 600, display: 'inline-block', margin: '0 auto' }}>
            {toastMessage}
          </div>
        )}
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // MODE 5: TIMELINE LIST
  // ══════════════════════════════════════════════════════════════════════════
  const TimelineView = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {reels.map((reel, idx) => {
        const isActive = idx === activeIndex;
        return (
          <div
            key={reel.reel_id}
            style={{
              display: 'flex', gap: 0, alignItems: 'stretch',
              position: 'relative',
            }}
          >
            {/* Timeline spine */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 14, paddingTop: 6 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: isActive ? 'var(--ig-gradient)' : 'var(--ig-surface)',
                border: isActive ? 'none' : '2px solid var(--ig-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800, color: isActive ? 'white' : 'var(--ig-text-muted)',
                cursor: 'pointer', zIndex: 2,
                boxShadow: isActive ? '0 0 16px rgba(131,58,180,0.5)' : 'none',
                transition: 'all 0.2s ease',
              }} onClick={() => goTo(idx)}>
                {idx + 1}
              </div>
              {idx < reels.length - 1 && (
                <div style={{ width: 2, flex: 1, minHeight: 20, background: 'var(--ig-border)', marginTop: 4 }} />
              )}
            </div>

            {/* Card */}
            <div style={{
              flex: 1, marginBottom: 12, borderRadius: 16, overflow: 'hidden',
              border: isActive ? '1px solid rgba(0,149,246,0.5)' : '1px solid var(--ig-border)',
              background: isActive ? 'rgba(0,149,246,0.05)' : 'var(--ig-surface)',
              cursor: 'pointer', transition: 'all 0.2s ease',
              boxShadow: isActive ? '0 4px 20px rgba(0,149,246,0.15)' : 'none',
            }} onClick={() => goTo(idx)}>
              <div style={{ display: 'flex', gap: 0 }}>
                {/* Thumbnail */}
                <div style={{ width: 100, height: 80, flexShrink: 0, overflow: 'hidden', borderRadius: '16px 0 0 16px', background: '#000' }}>
                  <VideoPlayer reelId={reel.reel_id} videoUrl={reel.video_url} isPlaying={isActive && isPlaying} isMuted={true} />
                </div>
                {/* Info */}
                <div style={{ flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <CategoryChip category={reel.category} />
                    <span style={{ fontSize: 10, color: 'var(--ig-text-muted)' }}>{reel.duration_seconds}s</span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'white', lineHeight: 1.3 }}>
                    {reel.title?.slice(0, 55)}{reel.title?.length > 55 ? '…' : ''}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10, color: 'var(--ig-text-muted)' }}>{reel.author_username}</span>
                    <div style={{ display: 'flex', gap: 8, fontSize: 10, color: 'var(--ig-text-muted)' }}>
                      <span>❤️ {formatNumber(reel.like_count)}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleLike(idx); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: 0 }}
                      >
                        {reel.liked ? '❤️' : '🤍'}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleSave(idx); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: 0 }}
                      >
                        {reel.saved ? '🔖' : '📑'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {toastMessage && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'rgba(18,18,18,0.95)', color: 'white', padding: '8px 20px', borderRadius: 24, fontSize: 12, fontWeight: 600, zIndex: 100, whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(0,0,0,0.6)' }}>
          {toastMessage}
        </div>
      )}
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // SHARED RIGHT PANEL
  // ══════════════════════════════════════════════════════════════════════════
  const RightPanel = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Watch simulator */}
      <GlassCard noHover style={{ padding: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ig-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          ⏱️ Simulate Watch Behavior
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          {[{ label: '100%', val: 100 }, { label: '75%', val: 75 }, { label: '50%', val: 50 }, { label: '25%', val: 25 }].map(p => (
            <button key={p.val} onClick={() => setWatchPercentage(activeIndex, p.val)}
              style={{ flex: 1, minWidth: 50, padding: '7px 4px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: activeReel.watch_percentage === p.val ? 'var(--ig-blue)' : 'rgba(255,255,255,0.04)', color: activeReel.watch_percentage === p.val ? 'white' : 'var(--ig-text-secondary)', border: activeReel.watch_percentage === p.val ? 'none' : '1px solid var(--ig-border)', cursor: 'pointer' }}>
              {p.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="range" min="0" max="100" value={activeReel.watch_percentage || 0}
            onChange={(e) => setWatchPercentage(activeIndex, Number(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--ig-blue)' }} />
          <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono', width: 40 }}>{activeReel.watch_percentage}%</span>
        </div>
      </GlassCard>

      {/* Comments */}
      {showComments && (
        <GlassCard style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>💬 Comments ({activeReel.comments_list?.length || 0})</div>
            <button onClick={() => setShowComments(false)} style={{ background: 'none', border: 'none', color: 'var(--ig-text-muted)', cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {(activeReel.comments_list || []).map((c, idx) => (
              <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: 8, fontSize: 12 }}>
                <span style={{ fontWeight: 700 }}>{c.author}: </span>
                <span style={{ color: 'var(--ig-text-secondary)' }}>{c.text}</span>
              </div>
            ))}
          </div>
          <form onSubmit={addComment} style={{ display: 'flex', gap: 8 }}>
            <input type="text" placeholder="Add a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)}
              style={{ flex: 1, padding: '7px 10px', borderRadius: 8, background: 'var(--ig-black)', border: '1px solid var(--ig-border)', color: 'white', fontSize: 12 }} />
            <button type="submit" style={{ padding: '7px 14px', borderRadius: 8, background: 'var(--ig-blue)', border: 'none', color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Post</button>
          </form>
        </GlassCard>
      )}

      {/* Live interest */}
      {currentAnalysis?.interest_profile && (
        <GlassCard noHover style={{ padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ig-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>🧠 Inferred Interest</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ig-text)', marginBottom: 4 }}>{currentAnalysis.interest_profile.primary_interest?.interest_name}</div>
          <ScoreBar label="Interest Score" value={currentAnalysis.interest_profile.primary_interest?.interest_score || 0} color="purple" />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11 }}>
            <span style={{ color: 'var(--ig-text-muted)' }}>Skill Level:</span>
            <span className={`skill-level-badge ${currentAnalysis.interest_profile.skill_level}`} style={{ fontSize: 11, padding: '2px 10px' }}>{currentAnalysis.interest_profile.skill_level}</span>
          </div>
        </GlassCard>
      )}

      {/* Top recommendation */}
      {currentAnalysis?.recommendations?.length > 0 && (
        <GlassCard style={{ padding: 20, border: '1px solid rgba(0,149,246,0.4)', background: 'rgba(0,149,246,0.05)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ig-blue)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>🎯 Recommended Reel</div>
          <CategoryChip category={currentAnalysis.recommendations[0].candidate.category} />
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ig-text)', marginTop: 6, marginBottom: 4 }}>{currentAnalysis.recommendations[0].candidate.title}</div>
          <div style={{ fontSize: 11, color: 'var(--ig-text-secondary)', lineHeight: 1.4, marginBottom: 8 }}>{currentAnalysis.recommendations[0].why_recommended}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
            <span style={{ color: 'var(--ig-green)', fontWeight: 700 }}>Match: {currentAnalysis.recommendations[0].interest_match_percent}%</span>
            <span style={{ color: 'var(--ig-text-muted)' }}>{currentAnalysis.recommendations[0].candidate.difficulty}</span>
          </div>
        </GlassCard>
      )}
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div>
      <ScrollModeBar />

      {scrollMode === 'vertical'   && <VerticalSnapView />}
      {scrollMode === 'horizontal' && <HorizontalCarouselView />}
      {scrollMode === 'grid'       && (
        <div className="ig-reels-feed-container">
          <GridMosaicView />
          <RightPanel />
        </div>
      )}
      {scrollMode === 'coverflow'  && (
        <div className="ig-reels-feed-container">
          <CoverflowView />
          <RightPanel />
        </div>
      )}
      {scrollMode === 'timeline'   && (
        <div className="ig-reels-feed-container">
          <div style={{ maxHeight: '85vh', overflowY: 'auto', paddingRight: 4, scrollbarWidth: 'thin' }}>
            <TimelineView />
          </div>
          <RightPanel />
        </div>
      )}
    </div>
  );
}
