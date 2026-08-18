import { useState } from 'react';
import { GlassCard, CategoryChip } from './UI';

export default function AgentOutputView({ data }) {
  const [selectedReelIdx, setSelectedReelIdx] = useState(0);

  if (!data || !data.per_reel_analysis || data.per_reel_analysis.length === 0) {
    return (
      <GlassCard noHover style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🤖</div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>No Agent Output Analysis Available Yet</div>
        <div style={{ fontSize: 12, color: 'var(--ig-text-secondary)', marginTop: 6 }}>
          Interact with reels in the feed to generate real-time AI Agent Structured Outputs.
        </div>
      </GlassCard>
    );
  }

  const perReelOutputs = data.per_reel_analysis;
  const currentItem = perReelOutputs[selectedReelIdx] || perReelOutputs[0];
  const recList = data.recommendations || [];
  const primaryInterest = data.interest_profile?.primary_interest?.interest_name || "Software Engineering / Technology";

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 900, margin: '0 auto' }}>
      
      {/* Header Banner */}
      <GlassCard noHover style={{ padding: 20, background: 'rgba(0,149,246,0.06)', border: '1px solid rgba(0,149,246,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ig-blue)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
              🤖 AI Recommendation Agent — Structured Output Spec
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>
              Required Output Format Breakdown
            </div>
          </div>

          <div style={{
            fontSize: 11, padding: '4px 12px', borderRadius: 20,
            background: 'var(--ig-gradient)', color: 'white', fontWeight: 700,
          }}>
            Strict Spec Compliant
          </div>
        </div>
      </GlassCard>

      {/* Reel Selector Tabs */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }}>
        {perReelOutputs.map((item, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedReelIdx(idx)}
            style={{
              padding: '8px 14px', borderRadius: 10,
              fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
              background: selectedReelIdx === idx ? 'var(--ig-blue)' : 'var(--ig-surface)',
              color: selectedReelIdx === idx ? 'white' : 'var(--ig-text-secondary)',
              border: selectedReelIdx === idx ? 'none' : '1px solid var(--ig-border)',
              cursor: 'pointer', transition: 'all 0.2s ease',
            }}
          >
            Reel #{idx + 1} Output
          </button>
        ))}
      </div>

      {/* Structured Output Card (Exact Match to Prompt Spec) */}
      <GlassCard noHover style={{ padding: 24, border: '1px solid var(--ig-border-light)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--ig-border)', paddingBottom: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: 'white' }}>
            📋 REQUIRED AGENT OUTPUT STRUCTURE
          </div>

          <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--ig-cyan)' }}>
            Confidence: {currentItem.confidence} ({currentItem.confidence_numeric}%)
          </div>
        </div>

        {/* Structured Grid Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontFamily: 'inherit' }}>
          
          {/* CURRENT REEL */}
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--ig-blue)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              CURRENT REEL:
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>
              {currentItem.reel_reference}
            </div>
          </div>

          {/* INTEREST DETECTED */}
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#e0aaff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              INTEREST DETECTED:
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ig-text)' }}>
              {currentItem.interest_detected || primaryInterest}
            </div>
          </div>

          {/* WHY */}
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--ig-green)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              WHY:
            </div>
            <div style={{ fontSize: 12, color: 'var(--ig-text-secondary)', lineHeight: 1.5 }}>
              {currentItem.why_interest}
            </div>
          </div>

          {/* RECOMMENDED TECH REEL */}
          <div style={{ background: 'rgba(0,149,246,0.08)', border: '1px solid rgba(0,149,246,0.3)', padding: 14, borderRadius: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--ig-blue)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              RECOMMENDED TECH REEL:
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'white', marginBottom: 6 }}>
              {currentItem.recommended_reel_title}
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--ig-text-muted)', fontWeight: 700 }}>CATEGORY:</span>
              <CategoryChip category={currentItem.recommended_reel_category} />
              
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ig-text-muted)', fontWeight: 700 }}>DIFFICULTY:</span>
              <span className={`skill-level-badge ${currentItem.difficulty}`} style={{ fontSize: 11, padding: '2px 10px' }}>
                {currentItem.difficulty}
              </span>
            </div>
          </div>

          {/* WHY THIS RECOMMENDATION */}
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--ig-orange)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              WHY THIS RECOMMENDATION:
            </div>
            <div style={{ fontSize: 12, color: 'var(--ig-text-secondary)', lineHeight: 1.5 }}>
              {currentItem.why_recommendation}
            </div>
          </div>

          {/* DIFFICULTY & CONFIDENCE SUMMARY ROW */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 4 }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--ig-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                DIFFICULTY:
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>
                {currentItem.difficulty} — {currentItem.difficulty_justification || "Matches learner progression curve"}
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--ig-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                CONFIDENCE:
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ig-green)' }}>
                {currentItem.confidence} ({currentItem.confidence_numeric}%)
              </div>
            </div>
          </div>

        </div>

      </GlassCard>

      {/* Top 5 Diversity Recommendations Ranking Table */}
      {recList && recList.length > 0 && (
        <GlassCard noHover style={{ padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ig-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            🎯 Top Educational Candidate Recommendations Pool
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recList.map((rec, rIdx) => (
              <div key={rIdx} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--ig-border)', fontSize: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontWeight: 800, color: 'var(--ig-blue)', fontSize: 13 }}>#{rec.rank}</span>
                  <div>
                    <div style={{ fontWeight: 700, color: 'white' }}>{rec.candidate.title}</div>
                    <div style={{ fontSize: 10, color: 'var(--ig-text-muted)' }}>{rec.why_recommended}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 140, justifyContent: 'flex-end' }}>
                  <CategoryChip category={rec.candidate.category} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ig-green)' }}>{rec.interest_match_percent}% Match</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

    </div>
  );
}
