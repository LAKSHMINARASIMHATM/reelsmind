import { useEffect, useRef } from 'react';
import { GlassCard } from './UI';

const NODE_COLORS = {
  reel:         '#8b5cf6',
  domain:       '#06b6d4',
  super_domain: '#10b981',
};

const NODE_RADII = {
  reel:         18,
  domain:       22,
  super_domain: 30,
};

export default function InterestGraph({ graphData }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!graphData || !graphData.nodes?.length) return;
    drawGraph(svgRef.current, graphData);
  }, [graphData]);

  if (!graphData?.nodes?.length) {
    return (
      <GlassCard noHover style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
        No interest graph data available.
      </GlassCard>
    );
  }

  return (
    <GlassCard noHover className="chart-card">
      <div className="chart-title">🕸 Reel → Topic → Latent Interest → Super-Domain</div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        {[['Reel', '#8b5cf6'], ['Domain', '#06b6d4'], ['Super-Domain', '#10b981']].map(([label, color]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
            {label}
          </div>
        ))}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <svg ref={svgRef} width="100%" style={{ minHeight: 360, display: 'block' }} />
      </div>
    </GlassCard>
  );
}

function drawGraph(svg, graphData) {
  if (!svg) return;

  const { nodes, edges } = graphData;
  const W = Math.max(svg.parentElement?.clientWidth || 700, 600);
  const H = 400;

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.innerHTML = '';

  // Create defs for glow filter
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  `;
  svg.appendChild(defs);

  // Layout: column-based by type
  const cols = { reel: 0, domain: 1, super_domain: 2 };
  const colX = [W * 0.15, W * 0.50, W * 0.82];

  const byType = { reel: [], domain: [], super_domain: [] };
  nodes.forEach(n => {
    const t = n.type || 'domain';
    if (byType[t]) byType[t].push(n);
  });

  const positions = {};

  Object.entries(byType).forEach(([type, ns]) => {
    const cx = colX[cols[type]] || W / 2;
    ns.forEach((n, i) => {
      const spacing = H / (ns.length + 1);
      positions[n.id] = { x: cx, y: spacing * (i + 1) };
    });
  });

  // Draw edges
  edges.forEach(e => {
    const from = positions[e.from];
    const to   = positions[e.to];
    if (!from || !to) return;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', from.x); line.setAttribute('y1', from.y);
    line.setAttribute('x2', to.x);   line.setAttribute('y2', to.y);
    line.setAttribute('stroke', 'rgba(139,92,246,0.25)');
    line.setAttribute('stroke-width', '1.5');
    svg.appendChild(line);
  });

  // Draw nodes
  nodes.forEach(n => {
    const pos    = positions[n.id];
    if (!pos) return;
    const type   = n.type || 'domain';
    const color  = NODE_COLORS[type] || '#8b5cf6';
    const r      = NODE_RADII[type] || 18;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
    g.style.cursor = 'pointer';

    // Circle
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('r', r);
    circle.setAttribute('fill', `${color}22`);
    circle.setAttribute('stroke', color);
    circle.setAttribute('stroke-width', '2');
    circle.setAttribute('filter', 'url(#glow)');
    g.appendChild(circle);

    // Score ring (if available)
    if (n.score && n.score > 0) {
      const maxScore = 3.0;
      const pct = Math.min(1, n.score / maxScore);
      const circ = 2 * Math.PI * (r - 2);
      const dash = circ * pct;
      const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ring.setAttribute('r', r - 2);
      ring.setAttribute('fill', 'none');
      ring.setAttribute('stroke', color);
      ring.setAttribute('stroke-width', '3');
      ring.setAttribute('stroke-dasharray', `${dash} ${circ - dash}`);
      ring.setAttribute('stroke-linecap', 'round');
      ring.setAttribute('transform', 'rotate(-90)');
      g.appendChild(ring);
    }

    // Label
    const shortId = n.id.length > 14 ? n.id.replace(' Engineering', '').replace(' Development', '') : n.id;
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('dominant-baseline', 'central');
    label.setAttribute('fill', color);
    label.setAttribute('font-size', type === 'super_domain' ? '9' : '8');
    label.setAttribute('font-weight', '700');
    label.setAttribute('font-family', 'Inter, sans-serif');

    // Multi-line for long labels
    const words = shortId.split(' ');
    if (words.length <= 2) {
      label.textContent = shortId;
    } else {
      words.forEach((word, wi) => {
        const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        tspan.textContent = word;
        tspan.setAttribute('x', '0');
        tspan.setAttribute('dy', wi === 0 ? `-${(words.length - 1) * 6}` : '12');
        label.appendChild(tspan);
      });
    }
    g.appendChild(label);
    svg.appendChild(g);
  });

  // Column labels
  [['REELS', colX[0]], ['DOMAINS', colX[1]], ['SUPER-DOMAIN', colX[2]]].forEach(([lbl, x]) => {
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', x);
    t.setAttribute('y', 16);
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('fill', 'rgba(255,255,255,0.15)');
    t.setAttribute('font-size', '9');
    t.setAttribute('font-weight', '700');
    t.setAttribute('font-family', 'Inter, sans-serif');
    t.setAttribute('letter-spacing', '0.1em');
    t.textContent = lbl;
    svg.appendChild(t);
  });
}
