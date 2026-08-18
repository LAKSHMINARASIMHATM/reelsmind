import { useState, useEffect } from 'react';
import SuggestedPanel from './SuggestedPanel';
import VideoPlayer from './VideoPlayer';
import { GlassCard, CategoryChip } from './UI';
import api from '../api';

export default function DashboardView({ user, reels, onSwitchUser, onInteractionUpdate, currentAnalysis }) {
  const [feedPosts, setFeedPosts] = useState([]);
  const [activeStory, setActiveStory] = useState(null);
  const [storyProgress, setStoryProgress] = useState(0);
  const [newComments, setNewComments] = useState({});
  const [heartPops, setHeartPops] = useState({});
  const [mutedVideos, setMutedVideos] = useState({});

  const formatPostsData = (list) => {
    return list.map(r => ({
      ...r,
      liked: Boolean(r.liked),
      saved: Boolean(r.saved),
      shared: Boolean(r.shared),
      commented: Boolean(r.commented),
      like_count: r.like_count || 184200,
      comments_list: r.comments_list || [
        { author: 'priya_ai', text: 'Great breakdown of system design patterns!' },
        { author: 'alex_dev', text: 'This saved me hours of debugging.' }
      ]
    }));
  };

  useEffect(() => {
    if (reels && reels.length > 0) {
      setFeedPosts(formatPostsData(reels));
    } else {
      // Fallback: load all reels directly if reels prop is empty
      api.getReels()
        .then(d => {
          if (d.reels && d.reels.length > 0) {
            setFeedPosts(formatPostsData(d.reels));
          }
        })
        .catch(err => console.error("Failed to load fallback posts:", err));
    }
  }, [reels]);

  // Story Auto-progress timer
  useEffect(() => {
    if (!activeStory) return;
    setStoryProgress(0);
    const interval = setInterval(() => {
      setStoryProgress(prev => {
        if (prev >= 100) {
          setActiveStory(null);
          clearInterval(interval);
          return 0;
        }
        return prev + 5;
      });
    }, 150);
    return () => clearInterval(interval);
  }, [activeStory]);

  const toggleLike = (index) => {
    const updated = [...feedPosts];
    const post = updated[index];
    post.liked = !post.liked;
    post.like_count += (post.liked ? 1 : -1);
    setFeedPosts(updated);

    if (post.liked) {
      setHeartPops(prev => ({ ...prev, [post.reel_id]: true }));
      setTimeout(() => {
        setHeartPops(prev => ({ ...prev, [post.reel_id]: false }));
      }, 850);
    }

    if (onInteractionUpdate) onInteractionUpdate(updated);
  };

  const toggleSave = (index) => {
    const updated = [...feedPosts];
    const post = updated[index];
    post.saved = !post.saved;
    setFeedPosts(updated);
    if (onInteractionUpdate) onInteractionUpdate(updated);
  };

  const toggleShare = (index) => {
    const updated = [...feedPosts];
    const post = updated[index];
    post.shared = !post.shared;
    setFeedPosts(updated);
    if (onInteractionUpdate) onInteractionUpdate(updated);
  };

  const toggleVideoMute = (reelId) => {
    setMutedVideos(prev => ({
      ...prev,
      [reelId]: !prev[reelId]
    }));
  };

  const handleAddComment = (index, e) => {
    e.preventDefault();
    const text = newComments[index];
    if (!text || !text.trim()) return;

    const updated = [...feedPosts];
    const post = updated[index];
    post.commented = true;
    post.comments_list = post.comments_list || [];
    post.comments_list.push({ author: user?.username || 'you', text: text.trim() });
    post.comment_count = (post.comment_count || 0) + 1;
    setFeedPosts(updated);

    setNewComments(prev => ({ ...prev, [index]: '' }));
    if (onInteractionUpdate) onInteractionUpdate(updated);
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 36, maxWidth: 980, margin: '0 auto' }} className="ig-dashboard-grid">
      
      {/* ─── LEFT MAIN CONTENT COLUMN ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
        
        {/* INSTAGRAM STORIES BAR */}
        <div className="stories-bar">
          {/* User's story */}
          <div className="story-item" onClick={() => setActiveStory({ username: user?.username || 'your_story', avatar: user?.avatar, title: 'My Daily Tech Reel Journey' })}>
            <div className="story-ring active-story">
              <div className="story-avatar">
                +
              </div>
            </div>
            <div className="story-name">Your story</div>
          </div>

          {/* Featured Creator Stories */}
          {feedPosts.slice(0, 6).map((post, idx) => (
            <div
              key={post.reel_id}
              className="story-item"
              onClick={() => setActiveStory({
                username: post.author_username || `@tech_creator_${idx}`,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.reel_id}`,
                title: post.title,
                category: post.category,
              })}
            >
              <div className="story-ring active-story">
                <div className="story-avatar">
                  {(post.author_username || 'T')[1]?.toUpperCase()}
                </div>
              </div>
              <div className="story-name">
                {(post.author_username || 'creator').replace('@', '')}
              </div>
            </div>
          ))}
        </div>

        {/* INSTAGRAM POSTS FEED (WITH ROBUST VIDEO PLAYER) */}
        {feedPosts.map((post, index) => {
          const isVideoMuted = mutedVideos[post.reel_id] !== false; // Default muted
          return (
            <div
              key={post.reel_id}
              style={{
                background: 'var(--ig-surface)',
                border: '1px solid var(--ig-border)',
                borderRadius: 16,
                overflow: 'hidden',
              }}
            >
              {/* Post Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', padding: 2,
                    background: 'var(--ig-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{
                      width: '100%', height: '100%', borderRadius: '50%',
                      background: '#121212', border: '1.5px solid black',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 12, color: 'white'
                    }}>
                      {(post.author_username || '@dev')[1]?.toUpperCase()}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ig-text)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {post.author_username || '@tech_creator'}
                      <span style={{ color: 'var(--ig-blue)', fontSize: 10 }}>✓</span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--ig-text-muted)' }}>
                      {post.music_title || '🎵 Original Sound'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <CategoryChip category={post.category} />
                  <span style={{ cursor: 'pointer', color: 'var(--ig-text-secondary)', fontSize: 14 }}>•••</span>
                </div>
              </div>

              {/* Robust Video Player */}
              <div style={{ position: 'relative', width: '100%', aspectRatio: '4/5' }}>
                {heartPops[post.reel_id] && (
                  <div className="heart-pop-animation">
                    ❤️
                  </div>
                )}

                <VideoPlayer
                  reelId={post.reel_id}
                  videoUrl={post.video_url}
                  title={post.title}
                  category={post.category}
                  description={post.description}
                  educationalValue={post.educational_value}
                  duration={post.duration_seconds}
                  isMuted={isVideoMuted}
                  isPlaying={true}
                  onDoubleTap={() => toggleLike(index)}
                />

                {/* Mute toggle button */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleVideoMute(post.reel_id); }}
                  style={{
                    position: 'absolute', bottom: 12, right: 12,
                    background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '50%', width: 32, height: 32,
                    color: 'white', fontSize: 12, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 15,
                  }}
                >
                  {isVideoMuted ? '🔇' : '🔊'}
                </button>
              </div>

              {/* Interactive Actions Row */}
              <div style={{ padding: '12px 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <button
                    onClick={() => toggleLike(index)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}
                    title="Like"
                  >
                    {post.liked ? '❤️' : '🤍'}
                  </button>

                  <button
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}
                    title="Comment"
                  >
                    💬
                  </button>

                  <button
                    onClick={() => toggleShare(index)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 19 }}
                    title="Share"
                  >
                    ✈️
                  </button>
                </div>

                <button
                  onClick={() => toggleSave(index)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}
                  title="Save"
                >
                  {post.saved ? '🔖' : '📑'}
                </button>
              </div>

              {/* Likes Count */}
              <div style={{ padding: '0 16px', fontSize: 13, fontWeight: 700, color: 'var(--ig-text)', marginBottom: 6 }}>
                {formatNumber(post.like_count)} likes
              </div>

              {/* Caption */}
              <div style={{ padding: '0 16px', fontSize: 12, lineHeight: 1.45, marginBottom: 8 }}>
                <strong style={{ fontWeight: 700, color: 'var(--ig-text)', marginRight: 6 }}>
                  {post.author_username || '@tech_creator'}
                </strong>
                <span style={{ color: 'var(--ig-text-secondary)' }}>{post.title} — {post.description}</span>
              </div>

              {/* Hashtags */}
              <div style={{ padding: '0 16px', display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                {(post.hashtags || post.topics || []).slice(0, 4).map((tag, tidx) => (
                  <span key={tidx} style={{ fontSize: 11, color: 'var(--ig-blue)', fontWeight: 600 }}>
                    {tag.startsWith('#') ? tag : `#${tag}`}
                  </span>
                ))}
              </div>

              {/* Comments List Preview */}
              {post.comments_list && post.comments_list.length > 0 && (
                <div style={{ padding: '0 16px', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontSize: 11, color: 'var(--ig-text-muted)', cursor: 'pointer', marginBottom: 2 }}>
                    View all {post.comments_list.length} comments
                  </div>
                  {post.comments_list.slice(-2).map((c, cidx) => (
                    <div key={cidx} style={{ fontSize: 11 }}>
                      <strong style={{ color: 'var(--ig-text)', marginRight: 4 }}>{c.author}</strong>
                      <span style={{ color: 'var(--ig-text-secondary)' }}>{c.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Comment Input Form */}
              <form
                onSubmit={(e) => handleAddComment(index, e)}
                style={{
                  display: 'flex', alignItems: 'center',
                  padding: '10px 16px', borderTop: '1px solid var(--ig-border)',
                }}
              >
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={newComments[index] || ''}
                  onChange={(e) => setNewComments(prev => ({ ...prev, [index]: e.target.value }))}
                  style={{
                    flex: 1, background: 'none', border: 'none',
                    color: 'white', fontSize: 12, fontFamily: 'inherit',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  disabled={!newComments[index]?.trim()}
                  style={{
                    background: 'none', border: 'none',
                    color: newComments[index]?.trim() ? 'var(--ig-blue)' : 'rgba(0,149,246,0.3)',
                    fontWeight: 700, fontSize: 12, cursor: newComments[index]?.trim() ? 'pointer' : 'default',
                  }}
                >
                  Post
                </button>
              </form>
            </div>
          );
        })}

      </div>

      {/* ─── RIGHT SIDEBAR COLUMN: INSTAGRAM SUGGESTED ACCOUNTS PANEL ─── */}
      <div style={{ position: 'sticky', top: 24 }} className="ig-desktop-sidebar">
        <SuggestedPanel user={user} onSwitchUser={onSwitchUser} />
      </div>

      {/* Interactive Fullscreen Story Viewer Modal */}
      {activeStory && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{
            position: 'relative', width: 340, height: 580,
            background: '#000', borderRadius: 20, border: '1px solid var(--ig-border-light)',
            padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            boxShadow: '0 20px 60px rgba(0,0,0,0.9)', overflow: 'hidden',
          }}>
            {/* Story Auto-progress Bar */}
            <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden', zIndex: 10 }}>
              <div style={{ height: '100%', width: `${storyProgress}%`, background: 'white', transition: 'width 0.15s linear' }} />
            </div>

            {/* Story Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, zIndex: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <img src={activeStory.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>{activeStory.username}</span>
              </div>
              <button onClick={() => setActiveStory(null)} style={{ background: 'none', border: 'none', color: 'white', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>

            {/* Story Video Content */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
              <VideoPlayer
                videoUrl="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
                title={activeStory.title}
                category={activeStory.category || "Story"}
                isMuted={true}
                isPlaying={true}
              />
            </div>

            <div style={{ fontSize: 11, color: 'white', textAlign: 'center', zIndex: 10, textShadow: '0 1px 3px black' }}>
              Tap to skip · Auto-advancing
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
