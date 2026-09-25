import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users2, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw,
  MessageSquare
} from 'lucide-react';
import { HumanFeedbackStats, HumanChoice } from '@droptest/shared';

interface RealFeedbackSectionProps {
  testId?: string;
}

export const RealFeedbackSection: React.FC<RealFeedbackSectionProps> = ({ testId }) => {
  const [stats, setStats] = useState<HumanFeedbackStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [filterChoice, setFilterChoice] = useState<HumanChoice | 'all'>('all');

  const fetchStats = useCallback(async () => {
    if (!testId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tests/${testId}/feedback-stats`);
      if (res.ok) {
        const data: HumanFeedbackStats = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Failed to fetch real feedback stats:', e);
    } finally {
      setIsLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const feedbackToken = stats?.feedback_token || '';
  const feedbackUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/feedback/${feedbackToken}`
    : `http://localhost:5173/feedback/${feedbackToken}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(feedbackUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const total = stats?.total || 0;
  const counts = stats?.counts || { A: 0, B: 0, neither: 0, unsure: 0 };

  const getPercent = (count: number) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  const responsesWithReasons = (stats?.responses || []).filter(r => r.reason && r.reason.trim().length > 0);
  const filteredResponses = filterChoice === 'all' 
    ? (stats?.responses || [])
    : (stats?.responses || []).filter(r => r.choice === filterChoice);

  if (!feedbackToken) return <div className="workbench-card"><h3>Responses from real people</h3><p>{isLoading ? 'Loading feedback…' : 'Complete the comparison to create a feedback link.'}</p></div>;

  return (
    <div 
      className="card" 
      style={{ 
        marginBottom: 'var(--space-5)', 
        border: '1px solid var(--color-border)', 
        background: 'var(--color-surface)',
        padding: 'var(--space-4)',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      {/* Header & Share Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users2 size={18} style={{ color: 'var(--color-primary)' }} />
          <div>
            <h4 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Responses from Real People
            </h4>
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              Independent human validation layer — strictly separated from simulated panel
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={fetchStats} disabled={isLoading}><RefreshCw size={12} /> Refresh</button>
          <a
            href={`/feedback/${feedbackToken}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
            style={{ fontSize: '11px', padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: '5px', textDecoration: 'none' }}
          >
            <ExternalLink size={12} />
            Open Link
          </a>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleCopy}
            style={{ fontSize: '11px', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Link Copied!' : 'Copy Feedback Link'}
          </button>
        </div>
      </div>

      {/* Shareable Link Box & Optional QR Code */}
      <div 
        style={{ 
          background: 'var(--color-surface-subtle)', 
          border: '1px solid var(--color-border-subtle)', 
          borderRadius: 'var(--radius-md)', 
          padding: '12px 14px', 
          marginBottom: 'var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', flexShrink: 0 }}>
              Shareable URL:
            </span>
            <code style={{ fontSize: '11px', color: 'var(--color-primary)', background: 'var(--color-surface)', padding: '3px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '500px' }}>
              {feedbackUrl}
            </code>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            Unguessable token • Zero simulated data exposed
          </span>
        </div>


      </div>

      {/* Recruitment statement and sample size disclaimer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: 'var(--space-3)', paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--color-border-subtle)', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
        <div>
          Statement: <strong>"Responses came from whoever received your link."</strong>
        </div>
        <div style={{ color: 'var(--color-text-muted)' }}>
          Best-effort duplicate prevention • Do not apply statistical confidence or population claims to a convenience sample
        </div>
      </div>

      {/* Empty State when 0 responses */}
      {total === 0 ? (
        <div 
          style={{ 
            background: 'var(--color-surface-subtle)', 
            border: '1px dashed var(--color-border)', 
            borderRadius: 'var(--radius-md)', 
            padding: '32px 20px', 
            textAlign: 'center' 
          }}
        >
          <MessageSquare size={32} style={{ color: 'var(--color-text-muted)', margin: '0 auto 10px auto' }} />
          <h5 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
            No responses yet — copy the feedback link.
          </h5>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', maxWidth: '520px', margin: '0 auto 16px auto', lineHeight: 1.45 }}>
            Simulated profiles generate questions worth checking. Share your public feedback link with prospective buyers to collect anonymous choices (A, B, neither, unsure) and qualitative reasons.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleCopy}
            style={{ fontSize: '12px', padding: '6px 14px' }}
          >
            {copied ? '✓ Link Copied to Clipboard!' : 'Copy Feedback Link'}
          </button>
        </div>
      ) : (
        <div>
          {/* Denominator Banner */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-3)' }}>
            <span style={{ fontSize: 'var(--font-size-md)', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
              {total} {total === 1 ? 'response' : 'responses'} from real people
            </span>
            <span className="badge badge-intended" style={{ fontSize: '11px' }}>
              Denominator: {total} total
            </span>
          </div>

          {/* 4 Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: 'var(--space-4)' }}>
            {/* Option A */}
            <div className="card" style={{ padding: '12px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
              <span className="badge badge-intended" style={{ fontSize: '10px', marginBottom: '4px' }}>Option A</span>
              <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                {counts.A} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-muted)' }}>({getPercent(counts.A)}%)</span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{counts.A} of {total} respondents</div>
            </div>

            {/* Option B */}
            <div className="card" style={{ padding: '12px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
              <span className="badge badge-adjacent" style={{ fontSize: '10px', marginBottom: '4px' }}>Option B</span>
              <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                {counts.B} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-muted)' }}>({getPercent(counts.B)}%)</span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{counts.B} of {total} respondents</div>
            </div>

            {/* Neither */}
            <div className="card" style={{ padding: '12px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
              <span className="badge badge-contrasting" style={{ fontSize: '10px', marginBottom: '4px' }}>Neither</span>
              <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
                {counts.neither} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-muted)' }}>({getPercent(counts.neither)}%)</span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{counts.neither} of {total} respondents</div>
            </div>

            {/* Unsure */}
            <div className="card" style={{ padding: '12px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
              <span className="badge badge-contrasting" style={{ fontSize: '10px', marginBottom: '4px' }}>Unsure</span>
              <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
                {counts.unsure} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-muted)' }}>({getPercent(counts.unsure)}%)</span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{counts.unsure} of {total} respondents</div>
            </div>
          </div>

          {/* Qualitative Quotes / Reasons Feed */}
          {responsesWithReasons.length > 0 && (
            <div style={{ marginTop: 'var(--space-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  Submitted Qualitative Reasons ({responsesWithReasons.length})
                </div>

                {/* Filter tabs */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  {(['all', 'A', 'B', 'neither', 'unsure'] as const).map(choice => (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => setFilterChoice(choice)}
                      style={{
                        fontSize: '10px',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                        border: filterChoice === choice ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                        background: filterChoice === choice ? 'var(--color-primary)' : 'var(--color-surface)',
                        color: filterChoice === choice ? '#FFF' : 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        textTransform: 'capitalize'
                      }}
                    >
                      {choice === 'all' ? 'All Reasons' : `Option ${choice}`}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                {filteredResponses
                  .filter(r => r.reason && r.reason.trim().length > 0)
                  .map((resp, idx) => (
                    <div 
                      key={resp.id || idx} 
                      style={{ 
                        padding: '10px 12px', 
                        background: 'var(--color-surface-subtle)', 
                        border: '1px solid var(--color-border-subtle)', 
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span 
                          className={`badge ${
                            resp.choice === 'A' ? 'badge-intended' : 
                            resp.choice === 'B' ? 'badge-adjacent' : 'badge-contrasting'
                          }`}
                          style={{ fontSize: '10px', textTransform: 'uppercase' }}
                        >
                          Chose {resp.choice === 'neither' ? 'Neither' : resp.choice === 'unsure' ? 'Unsure' : `Option ${resp.choice}`}
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                          {new Date(resp.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ color: 'var(--color-text-primary)', fontStyle: 'italic', margin: 0 }}>
                        "{resp.reason}"
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
