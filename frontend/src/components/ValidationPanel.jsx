import { useState } from 'react';
import api from '../api';
import { GlassCard, LoadingSpinner } from './UI';

export default function ValidationPanel() {
  const [report, setReport]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const runValidation = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.runValidation();
      setReport(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <button className="validation-btn" onClick={runValidation} disabled={loading}>
          {loading ? '⏳ Running Tests...' : '▶ Run All Validation Tests'}
        </button>
        <p style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
          Runs 6 automated tests: Java Trap, AI Learner, Entertainment, Hype Rejection, Educational Value, Latency
        </p>
      </div>

      {error && (
        <GlassCard noHover style={{ padding: 16, border: '1px solid rgba(239,68,68,0.3)', marginBottom: 16 }}>
          <div style={{ color: 'var(--accent-red)' }}>⚠ {error}</div>
        </GlassCard>
      )}

      {loading && <LoadingSpinner text="Running validation suite..." />}

      {report && !loading && (
        <>
          {/* Overall result banner */}
          <GlassCard noHover style={{
            padding: 20,
            marginBottom: 20,
            border: `1px solid ${report.overall_pass ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
            background: report.overall_pass ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4, color: report.overall_pass ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {report.overall_pass ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {report.test_results?.filter(t => t.passed).length}/{report.test_results?.length} tests passing
            </div>
          </GlassCard>

          {/* Metrics */}
          <div className="validation-summary">
            {[
              { label: 'Hype Rejection Rate', value: `${(report.hype_rejection_rate * 100).toFixed(0)}%`, color: 'var(--accent-green)' },
              { label: 'Trap Success Rate',   value: `${(report.trap_success_rate * 100).toFixed(0)}%`,   color: 'var(--accent-purple)' },
              { label: 'Avg Processing Time', value: `${report.average_processing_time_seconds?.toFixed(2)}s`, color: 'var(--accent-cyan)' },
              { label: 'Inference Accuracy',  value: `${(report.interest_inference_accuracy * 100).toFixed(0)}%`, color: 'var(--accent-orange)' },
              { label: 'F1 Score',            value: report.f1_score?.toFixed(3),                          color: 'var(--accent-pink)' },
              { label: 'Educational Reels',   value: report.educational_recommendations,                   color: 'var(--accent-cyan)' },
            ].map(m => (
              <div key={m.label} className="val-metric">
                <div className="val-metric-value" style={{ color: m.color }}>{m.value}</div>
                <div className="val-metric-label">{m.label}</div>
              </div>
            ))}
          </div>

          {/* Test Results */}
          <div style={{ marginBottom: 12, fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Test Results
          </div>
          {report.test_results?.map((t, i) => (
            <div key={i} className="test-result-row">
              <div className="test-icon">{t.passed ? '✅' : '❌'}</div>
              <div style={{ flex: 1 }}>
                <div className="test-name" style={{ color: t.passed ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                  {t.test_name}
                </div>
                <div className="test-actual">{t.actual}</div>
                <div className="test-details">{t.details}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
                  Expected: {t.expected}
                </div>
              </div>
            </div>
          ))}

          {/* Final report block */}
          <GlassCard noHover style={{ padding: 16, marginTop: 20, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.8 }}>
            <div style={{ color: 'var(--accent-purple)', fontWeight: 700, marginBottom: 8 }}>=== MODEL VALIDATION REPORT ===</div>
            <div>Total Reels Processed:       {report.total_reels_processed}</div>
            <div>Interest Inference Accuracy:  {(report.interest_inference_accuracy * 100).toFixed(1)}%</div>
            <div>Precision:                    {report.precision?.toFixed(4)}</div>
            <div>Recall:                       {report.recall?.toFixed(4)}</div>
            <div>F1 Score:                     {report.f1_score?.toFixed(4)}</div>
            <div>Hype Content Detected:        {report.hype_content_detected}</div>
            <div>Hype Content Rejected:        {report.hype_content_rejected}</div>
            <div>Hype Rejection Rate:          {(report.hype_rejection_rate * 100).toFixed(1)}%</div>
            <div>Trap Tests Passed:            {report.trap_tests_passed}/{report.trap_tests_total}</div>
            <div>Trap Success Rate:            {(report.trap_success_rate * 100).toFixed(1)}%</div>
            <div>Educational Recommendations:  {report.educational_recommendations}</div>
            <div>Avg Processing Time:          {report.average_processing_time_seconds?.toFixed(3)}s</div>
            <div style={{ marginTop: 8, color: report.overall_pass ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 700 }}>
              OVERALL: {report.overall_pass ? '✅ PASS' : '❌ FAIL'}
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
}
