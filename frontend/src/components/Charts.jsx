import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, Legend,
} from 'recharts';
import { GlassCard } from './UI';

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(19,19,31,0.95)',
  border: '1px solid rgba(139,92,246,0.3)',
  borderRadius: 8,
  color: 'var(--text-primary)',
  fontSize: 12,
};

export function EngagementBarChart({ data }) {
  if (!data?.reels?.length) return null;
  const chartData = data.reels.map(r => ({
    name: r.reel_id,
    watch: r.watch_percentage,
    behavioral: r.behavioral_score,
    educational: r.educational_value * 100,
  }));
  return (
    <GlassCard className="chart-card" noHover>
      <div className="chart-title">📊 Engagement & Behavioral Scores</div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} barCategoryGap="20%">
          <XAxis dataKey="name" tick={{ fill: '#606080', fontSize: 11 }} />
          <YAxis tick={{ fill: '#606080', fontSize: 11 }} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#a0a0c0' }} />
          <Bar dataKey="watch" name="Watch %" fill="#8b5cf6" radius={[4,4,0,0]} />
          <Bar dataKey="behavioral" name="Behavioral Score" fill="#06b6d4" radius={[4,4,0,0]} />
          <Bar dataKey="educational" name="Edu Value %" fill="#10b981" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}

export function InterestRadarChart({ interests }) {
  if (!interests?.length) return null;
  const chartData = interests.slice(0, 6).map(i => ({
    subject: i.interest_name.replace(' Engineering', '').replace(' Development', ''),
    score: i.interest_score,
    fullMark: 100,
  }));
  return (
    <GlassCard className="chart-card" noHover>
      <div className="chart-title">🕸 Interest Radar</div>
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={chartData}>
          <PolarGrid stroke="rgba(255,255,255,0.08)" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#a0a0c0', fontSize: 10 }} />
          <PolarRadiusAxis tick={{ fill: '#606080', fontSize: 9 }} domain={[0, 100]} />
          <Radar name="Interest" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
        </RadarChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}

export function SignalsAreaChart({ data }) {
  if (!data?.reels?.length) return null;
  const chartData = data.reels.map(r => ({
    name: r.reel_id,
    liked: r.liked * 100,
    saved: r.saved * 100,
    shared: r.shared * 100,
    rewatched: r.rewatched * 100,
  }));
  return (
    <GlassCard className="chart-card" noHover>
      <div className="chart-title">🔔 Engagement Signals per Reel</div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData}>
          <XAxis dataKey="name" tick={{ fill: '#606080', fontSize: 11 }} />
          <YAxis tick={{ fill: '#606080', fontSize: 11 }} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#a0a0c0' }} />
          <Area type="monotone" dataKey="liked" name="Liked" stroke="#ec4899" fill="rgba(236,72,153,0.15)" strokeWidth={2} />
          <Area type="monotone" dataKey="saved" name="Saved" stroke="#8b5cf6" fill="rgba(139,92,246,0.15)" strokeWidth={2} />
          <Area type="monotone" dataKey="shared" name="Shared" stroke="#06b6d4" fill="rgba(6,182,212,0.10)" strokeWidth={2} />
          <Area type="monotone" dataKey="rewatched" name="Rewatched" stroke="#10b981" fill="rgba(16,185,129,0.10)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}

export function DomainScoreChart({ normalized }) {
  if (!normalized || !Object.keys(normalized).length) return null;
  const chartData = Object.entries(normalized)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([domain, score]) => ({ domain: domain.replace(' Engineering', '').replace(' Development', ''), score }));
  return (
    <GlassCard className="chart-card" noHover>
      <div className="chart-title">🗺 Domain Interest Scores</div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} layout="vertical" barCategoryGap="15%">
          <XAxis type="number" domain={[0, 100]} tick={{ fill: '#606080', fontSize: 11 }} />
          <YAxis type="category" dataKey="domain" tick={{ fill: '#a0a0c0', fontSize: 10 }} width={120} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Bar dataKey="score" fill="#8b5cf6" radius={[0,4,4,0]}
            background={{ fill: 'rgba(255,255,255,0.03)', radius: [0,4,4,0] }} />
        </BarChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}
