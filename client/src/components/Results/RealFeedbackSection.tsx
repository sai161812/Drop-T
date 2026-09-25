import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users2, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw,
  MessageSquare
} from 'lucide-react';
import { HumanFeedbackStats, HumanChoice, FounderFeedbackBreakdown } from '@droptest/shared';
import { useAuth } from '../../context/AuthContext.js';

interface RealFeedbackSectionProps {
  testId?: string;
}

const LegacyRealFeedbackSection: React.FC<RealFeedbackSectionProps> = ({ testId }) => {
  const { token } = useAuth();
  const [stats, setStats] = useState<HumanFeedbackStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [filterChoice, setFilterChoice] = useState<HumanChoice | 'all'>('all');

  const fetchStats = useCallback(async () => {
    if (!testId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tests/${testId}/feedback-stats`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data: HumanFeedbackStats = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Failed to fetch real feedback stats:', e);
    } finally {
      setIsLoading(false);
    }
  }, [testId, token]);

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

interface RealFeedbackResultsProps {
  testId?: string;
  productId?: string;
  showLegacyFeedback?: boolean;
}

const CommunityFeedbackPanel: React.FC<{ productId: string }> = ({ productId }) => {
  const { token } = useAuth();
  const [breakdown, setBreakdown] = useState<FounderFeedbackBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    fetch(`/api/products/${productId}/feedback/breakdown`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load product feedback.');
      if (!cancelled) setBreakdown(data);
    }).catch((err: Error) => {
      if (!cancelled) setError(err.message);
    }).finally(() => {
      if (!cancelled) setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, [productId, token]);

  const counts = breakdown?.counts || { yes: 0, maybe: 0, no: 0 };
  return (
    <section className="card" aria-labelledby="community-feedback-title" style={{ marginBottom: 'var(--space-5)', border: '1px solid var(--color-border)', background: 'var(--color-surface)', padding: 'var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <div>
          <h4 id="community-feedback-title" style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, color: 'var(--color-text-primary)' }}>Product Community Feedback</h4>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 3 }}>Responses from product visitors. Counts are separate from Synthetic Lab personas and anonymous test-link responses.</p>
        </div>
        <a href={`/product/${productId}`} className="btn btn-secondary" style={{ textDecoration: 'none', fontSize: 11 }}>
          View public product <ExternalLink size={12} />
        </a>
      </div>
      {isLoading ? <p role="status">Loading community feedback…</p> : error ? <p role="alert" style={{ color: 'var(--color-danger)' }}>{error}</p> : (
        <>
          <div style={{ fontSize: 12, marginBottom: 10 }}><strong>{breakdown?.total || 0}</strong> unique respondents</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, marginBottom: 12 }}>
            {([['Yes', counts.yes], ['Maybe', counts.maybe], ['No', counts.no]] as const).map(([label, count]) => (
              <div key={label} style={{ background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border-subtle)', borderRadius: 6, padding: 10 }}>
                <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{label}</span>
                <div className="tabular-nums" style={{ fontSize: 20, fontWeight: 700 }}>{count}</div>
              </div>
            ))}
          </div>
          {breakdown?.responses.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
              {breakdown.responses.filter(response => response.reason?.trim()).map(response => (
                <article key={response.id} style={{ border: '1px solid var(--color-border-subtle)', borderRadius: 6, padding: '9px 11px' }}>
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                    <strong>{response.choice.toUpperCase()}</strong> · {response.factor.replace(/_/g, ' ')} · {response.author.display_name}
                  </div>
                  <p style={{ margin: '5px 0 0', fontSize: 12 }}>{response.reason}</p>
                </article>
              ))}
            </div>
          ) : <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>No community responses yet. Feedback will appear here after visitors respond on the product page.</p>}
        </>
      )}
    </section>
  );
};

export const RealFeedbackSection: React.FC<RealFeedbackResultsProps> = ({ testId, productId, showLegacyFeedback = false }) => (
  <>
    {productId && <CommunityFeedbackPanel productId={productId} />}
    {showLegacyFeedback && testId && <LegacyRealFeedbackSection testId={testId} />}
  </>
);
