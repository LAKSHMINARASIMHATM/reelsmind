// Reusable UI components

export function GlassCard({ children, className = '', noHover = false, style = {} }) {
  return (
    <div className={`glass-card ${noHover ? 'no-hover' : ''} ${className}`} style={style}>
      {children}
    </div>
  );
}

export function SectionTitle({ children }) {
  return <h2 className="section-title">{children}</h2>;
}

export function ScoreBar({ label, value, max = 100, color = 'purple', showValue = true }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="score-bar-container">
      <div className="score-bar-label">
        <span>{label}</span>
        {showValue && <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{typeof value === 'number' ? value.toFixed(1) : value}</span>}
      </div>
      <div className="score-bar">
        <div
          className={`score-bar-fill ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function ConfidenceChip({ level }) {
  return <span className={`confidence-chip ${level}`}>{level}</span>;
}

export function CategoryChip({ category }) {
  const validCats = ['AI', 'HLD', 'Backend', 'DSA', 'Career', 'Cloud', 'Cybersecurity', 'DevTools'];
  const cls = validCats.includes(category) ? category : 'Default';
  return <span className={`rec-cat-chip ${cls}`}>{category}</span>;
}

export function MetaChip({ icon, label, value, matchClass = '' }) {
  return (
    <span className={`meta-chip ${matchClass}`}>
      {icon && <span>{icon}</span>}
      {label && <span style={{ opacity: 0.7 }}>{label}:</span>}
      <strong>{value}</strong>
    </span>
  );
}

export function LoadingSpinner({ text = 'Analyzing...' }) {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner" />
      <div className="loading-text">{text}</div>
    </div>
  );
}

export function EmptyState({ icon = '🔍', text = 'No data available' }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <div className="empty-state-text">{text}</div>
    </div>
  );
}

export function ProcessingBadge({ seconds }) {
  return (
    <span className="processing-badge">
      ⚡ {seconds.toFixed(2)}s
    </span>
  );
}
