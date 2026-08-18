import { useState, useRef, useEffect } from 'react';
import api from '../api';

// ─── Module-level singleton: one API fetch for all VideoPlayer instances ─────
// Starts with the same 30 fallback URLs; replaced the moment /api/videos responds.
let _videoPoolCache = null;   // null = not yet fetched
let _fetchPromise   = null;   // in-flight fetch guard

const FALLBACK_STREAMS = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
  "https://www.w3schools.com/html/mov_bbb.mp4",
  "https://vjs.zencdn.net/v/oceans.mp4",
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  "https://media.w3.org/2010/05/sintel/trailer.mp4",
  "https://filesamples.com/samples/video/mp4/sample_640x360.mp4",
];

/**
 * Resolves the global video pool.
 * - First call fires one fetch to /api/videos and caches the result.
 * - Subsequent calls return the cache instantly.
 * - If the API is down, falls back to FALLBACK_STREAMS.
 */
async function resolveVideoPool() {
  if (_videoPoolCache) return _videoPoolCache;
  if (!_fetchPromise) {
    _fetchPromise = api.getVideos()
      .then(data => {
        const urls = (data.videos || []).map(v => v.url).filter(Boolean);
        _videoPoolCache = urls.length > 0 ? urls : FALLBACK_STREAMS;
        return _videoPoolCache;
      })
      .catch(() => {
        _videoPoolCache = FALLBACK_STREAMS;
        return _videoPoolCache;
      });
  }
  return _fetchPromise;
}

/** Deterministic index from reel_id / title string */
function hashIndex(str, len) {
  return Math.abs(
    (str || 'R001').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  ) % len;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function VideoPlayer({
  videoUrl,
  title,
  category,
  description,
  educationalValue,
  duration,
  isMuted = true,
  isPlaying = true,
  onDoubleTap,
  reelId = 'R001',
}) {
  const videoRef = useRef(null);
  const [pool, setPool]         = useState(_videoPoolCache || FALLBACK_STREAMS);
  const [retryCount, setRetry]  = useState(0);
  const [currentSrc, setSrc]    = useState('');

  // ── 1. Load video pool from API on first mount ──────────────────────────
  useEffect(() => {
    let active = true;
    resolveVideoPool().then(resolved => {
      if (active) setPool(resolved);
    });
    return () => { active = false; };
  }, []);

  // ── 2. Resolve source whenever pool / reelId / videoUrl changes ──────────
  useEffect(() => {
    const idx = hashIndex(reelId || title, pool.length);
    const preferred = videoUrl && videoUrl.startsWith('http') ? videoUrl : pool[idx];
    setSrc(preferred);
    setRetry(0);
  }, [pool, videoUrl, reelId, title]);

  // ── 3. Play / Pause sync ─────────────────────────────────────────────────
  useEffect(() => {
    if (!videoRef.current || !currentSrc) return;
    if (isPlaying) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying, currentSrc]);

  // ── 4. Auto-retry next stream on error ──────────────────────────────────
  const handleError = () => {
    if (retryCount < pool.length - 1) {
      const baseIdx = hashIndex(reelId || title, pool.length);
      const next = (baseIdx + retryCount + 1) % pool.length;
      console.warn(`[VideoPlayer] Error loading ${currentSrc} → trying pool[${next}]`);
      setRetry(r => r + 1);
      setSrc(pool[next]);
    }
  };

  return (
    <div
      onDoubleClick={onDoubleTap}
      style={{
        position: 'relative', width: '100%', height: '100%',
        background: '#07070e', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {/* HTML5 Video — src driven by API pool */}
      <video
        ref={videoRef}
        src={currentSrc}
        autoPlay={isPlaying}
        loop
        muted={isMuted}
        playsInline
        onError={handleError}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />

      {/* Floating category / edu-depth badge */}
      <div style={{
        position: 'absolute', top: 12, left: 12,
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: 12, padding: '4px 10px',
        fontSize: 10, color: 'var(--ig-cyan)', fontWeight: 700, zIndex: 10,
      }}>
        🎬 {category || 'Tech'} · {(educationalValue ? educationalValue * 100 : 85).toFixed(0)}% Edu
      </div>

      {/* API source badge — bottom right, subtle */}
      <div style={{
        position: 'absolute', bottom: 6, right: 8,
        fontSize: 8, color: 'rgba(255,255,255,0.35)', zIndex: 10,
        fontFamily: 'JetBrains Mono, monospace',
      }}>
        via /api/videos
      </div>
    </div>
  );
}
