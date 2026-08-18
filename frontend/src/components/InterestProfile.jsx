import { GlassCard, ScoreBar, ConfidenceChip } from './UI';

// Interest Profile Panel
export function InterestProfilePanel({ profile }) {
  if (!profile) return null;
  const { primary_interest, secondary_interests, skill_level, skill_level_justification,
          total_reels_analyzed, entertainment_ratio, tech_engagement_ratio } = profile;

  return (
    <div>
      {/* Skill Level */}
      <GlassCard className="skill-card" style={{ marginBottom: 16 }} noHover>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Estimated Skill Level</div>
        <div className="skill-level-display">
          <span className={`skill-level-badge ${skill_level}`}>{skill_level}</span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{skill_level_justification}</span>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
          <div style={{ flex: 1, textAlign: 'center', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-purple)' }}>{total_reels_analyzed}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Reels Analyzed</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-cyan)' }}>{(tech_engagement_ratio * 100).toFixed(0)}%</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tech Content</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-orange)' }}>{(entertainment_ratio * 100).toFixed(0)}%</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Entertainment</div>
          </div>
        </div>
      </GlassCard>

      {/* Primary Interest */}
      <GlassCard className="interest-card" style={{ marginBottom: 16 }}>
        <div className="interest-badge primary">⭐ Primary Interest</div>
        <div className="interest-name">{primary_interest.interest_name}</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
          {primary_interest.description}
        </div>
        <ScoreBar label="Interest Score" value={primary_interest.interest_score} color="purple" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
          <ConfidenceChip level={primary_interest.confidence} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{primary_interest.confidence_numeric.toFixed(1)}/100</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
            {primary_interest.supporting_reels.length} supporting reel{primary_interest.supporting_reels.length !== 1 ? 's' : ''}
          </span>
        </div>
        {primary_interest.supporting_reels.length > 0 && (
          <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {primary_interest.supporting_reels.map(rid => (
              <span key={rid} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'rgba(139,92,246,0.15)', color: 'var(--accent-purple)', fontFamily: 'JetBrains Mono, monospace' }}>
                {rid}
              </span>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Secondary Interests */}
      {secondary_interests.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Secondary Interests</div>
          <div className="interest-grid">
            {secondary_interests.slice(0, 4).map((interest, i) => (
              <GlassCard key={i} className="interest-card" style={{ padding: 16 }}>
                <div className="interest-badge secondary">◆ {i + 2}nd</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>{interest.interest_name}</div>
                <ScoreBar label="Score" value={interest.interest_score} color="cyan" />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                  <ConfidenceChip level={interest.confidence} />
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{interest.confidence_numeric.toFixed(1)}/100</span>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Behavioral Evidence Panel
export function BehavioralSignals({ evidence }) {
  if (!evidence) return null;
  const signals = [
    { label: 'Watch Completion', value: evidence.watch_completion_contribution, color: '#8b5cf6' },
    { label: 'Rewatch Signal', value: evidence.rewatch_contribution, color: '#06b6d4' },
    { label: 'Like Signal', value: evidence.like_contribution, color: '#ec4899' },
    { label: 'Share Signal', value: evidence.share_contribution, color: '#10b981' },
    { label: 'Save Signal', value: evidence.save_contribution, color: '#f59e0b' },
    { label: 'Comment Signal', value: evidence.comment_contribution, color: '#ef4444' },
    { label: 'Semantic Relevance', value: evidence.semantic_relevance_contribution, color: '#8b5cf6' },
    { label: 'Cross-Reel Consistency', value: evidence.cross_reel_contribution, color: '#06b6d4' },
  ];
  return (
    <div className="signals-grid">
      {signals.map(s => (
        <div key={s.label} className="signal-item">
          <div className="signal-label">{s.label}</div>
          <div className="signal-value" style={{ color: s.color }}>{(s.value * 100).toFixed(1)}%</div>
          <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginTop: 4 }}>
            <div style={{ height: '100%', width: `${Math.min(100, s.value * 100 / 0.25)}%`, background: s.color, borderRadius: 2, transition: 'width 1s ease' }} />
          </div>
        </div>
      ))}
    </div>
  );
}
