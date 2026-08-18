import { GlassCard, CategoryChip, MetaChip, ConfidenceChip } from './UI';

export function RecommendationCard({ rec, index }) {
  const { candidate, interest_match_percent, recommendation_score,
          why_recommended, confidence, confidence_numeric,
          connected_interests, skill_progression_rationale } = rec;

  const matchClass = interest_match_percent >= 60 ? 'match-high' : 'match-med';

  return (
    <GlassCard className="rec-card">
      <div className="rec-rank">{rec.rank}</div>

      {/* Header */}
      <div className="rec-header">
        <CategoryChip category={candidate.category} />
        <div className="rec-title">{candidate.title}</div>
      </div>

      {/* Meta chips */}
      <div className="rec-meta">
        <MetaChip icon="🎯" label="Match" value={`${interest_match_percent.toFixed(1)}%`} matchClass={matchClass} />
        <MetaChip icon="📚" label="Edu Value" value={`${(candidate.educational_value * 100).toFixed(0)}%`} />
        <MetaChip icon="⚡" label="Score" value={recommendation_score.toFixed(3)} />
        <MetaChip icon="🎓" value={candidate.difficulty} />
        <ConfidenceChip level={confidence} />
        <MetaChip value={`${confidence_numeric.toFixed(0)}/100`} />
      </div>

      {/* Why recommended */}
      <div className="rec-why">{why_recommended}</div>

      {/* Learning Outcomes */}
      {candidate.learning_outcomes?.length > 0 && (
        <div>
          <div className="learning-outcomes-title">📖 Learning Outcomes</div>
          {candidate.learning_outcomes.map((lo, i) => (
            <div key={i} className="learning-outcome-item">
              {lo.outcome}
            </div>
          ))}
        </div>
      )}

      {/* Skill progression */}
      {skill_progression_rationale && (
        <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(16,185,129,0.08)', borderRadius: 8, border: '1px solid rgba(16,185,129,0.15)' }}>
          <div style={{ fontSize: 11, color: 'var(--accent-green)', fontWeight: 600 }}>📈 Skill Progression: {skill_progression_rationale}</div>
        </div>
      )}

      {/* Score breakdown bar */}
      <div style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
          <span>Recommendation Score</span>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{(recommendation_score * 100).toFixed(1)}%</span>
        </div>
        <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${recommendation_score * 100}%`,
            background: 'linear-gradient(90deg, var(--accent-purple), var(--accent-pink))',
            borderRadius: 3,
            transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)',
          }} />
        </div>
      </div>
    </GlassCard>
  );
}

export function RejectedCard({ item }) {
  return (
    <GlassCard className="rejected-card" noHover>
      <div className="rejected-title">🚫 {item.title}</div>
      {item.rejection_reasons?.map((reason, i) => (
        <div key={i} className="rejected-reason">
          <span>⚠</span>
          <span>{reason}</span>
        </div>
      ))}
      <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
        <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: 'var(--accent-red)' }}>
          Hype: {(item.hype_score * 100).toFixed(0)}%
        </span>
        <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
          Edu: {(item.educational_value * 100).toFixed(0)}%
        </span>
      </div>
    </GlassCard>
  );
}
