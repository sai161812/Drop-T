import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  RefreshCw, 
  ShieldCheck, 
  AlertCircle, 
  Clock, 
  Sliders
} from 'lucide-react';
import { EmptyState } from '../components/Common/EmptyState.js';
import { Run, Evaluation, ResponseCategory } from '@droptest/shared';

interface ResultsPageProps {
  testId?: string;
  onNavigateToSetup: () => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({ testId, onNavigateToSetup }) => {
  const [run, setRun] = useState<Run | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const fetchLatestRun = useCallback(async () => {
    if (!testId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tests/${testId}/runs/latest`);
      if (res.ok) {
        const data = await res.json();
        setRun(data.run || null);
        setEvaluations(data.evaluations || []);
      }
    } catch (e) {
      console.error('Failed to fetch latest run:', e);
    } finally {
      setIsLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    fetchLatestRun();
  }, [fetchLatestRun]);

  const handleRetryIncomplete = async () => {
    if (!testId || !run) return;
    setIsRetrying(true);
    try {
      const res = await fetch(`/api/tests/${testId}/runs/${run.id}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        setRun(data.run || run);
        setEvaluations(data.evaluations || []);
      }
    } catch (e) {
      console.error('Retry failed:', e);
    } finally {
      setIsRetrying(false);
    }
  };

  // If loading without cached run
  if (isLoading && !run) {
    return (
      <div style={{ maxWidth: '900px', margin: '60px auto', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
        Loading simulation results...
      </div>
    );
  }

  // If no test or no run exists
  if (!testId || !run) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        <EmptyState
          icon={BarChart3}
          title="No Simulation Run Available Yet"
          message="Simulated comparative results, audience breakdown, and break-even analysis will appear here after executing a test run."
          actionTitle="What you can do right now:"
          actionSteps={[
            'Navigate to "Set up test" to configure your domain, offering, and baseline (Option A).',
            'Select your primary comparison lever (Price, Message, Served Markets, or Creative) and configure Option B.',
            'Review the 20/20/10 panel distribution (20 intended / 20 adjacent / 10 contrasting) and audience markets.',
            'Click "Run 50 simulated profiles" to execute the 100-evaluation paired evaluation.'
          ]}
          primaryActionLabel="Go to Set up test"
          onPrimaryAction={onNavigateToSetup}
        />
      </div>
    );
  }

  // Calculate response stats
  const evalsA = evaluations.filter(e => e.option_id === 'A');
  const evalsB = evaluations.filter(e => e.option_id === 'B');

  const countByResponse = (list: Evaluation[]) => {
    const counts: Record<ResponseCategory, number> = {
      interested: 0,
      unsure: 0,
      not_interested: 0,
      unavailable: 0
    };
    for (const e of list) {
      if (counts[e.response] !== undefined) counts[e.response]++;
    }
    return counts;
  };

  const countsA = countByResponse(evalsA);
  const countsB = countByResponse(evalsB);

  // Paired profiles for table
  const profileIds = Array.from(new Set(evaluations.map(e => e.profile_id))).sort();

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', paddingBottom: 'var(--space-8)' }}>
      {/* Header & Status Card */}
      <div className="card" style={{ marginBottom: 'var(--space-5)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Simulation Run Results
              </h2>
              <span 
                className="badge" 
                style={{ 
                  background: run.status === 'completed' ? 'var(--color-success-bg)' : run.status === 'partial' ? 'var(--color-warning-bg)' : 'var(--color-danger-bg)',
                  color: run.status === 'completed' ? 'var(--color-success)' : run.status === 'partial' ? 'var(--color-warning)' : 'var(--color-danger)',
                  fontWeight: 600,
                  textTransform: 'capitalize'
                }}
              >
                {run.status === 'completed' ? 'Completed (100 / 100)' : run.status === 'partial' ? `Incomplete (${run.total_evaluations_completed} / 100)` : 'Run Failed / Unconfigured'}
              </span>
            </div>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Evaluated across 50 paired buyer personas (20 intended / 20 adjacent / 10 contrasting) using model: <strong>{run.model_id || 'llama-3.3-70b-versatile'}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {run.status === 'partial' && (
              <button
                type="button"
                className="btn btn-primary"
                style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={handleRetryIncomplete}
                disabled={isRetrying}
              >
                <RefreshCw size={13} className={isRetrying ? 'animate-spin' : ''} />
                {isRetrying ? 'Retrying Incomplete...' : 'Retry Missing Evaluations'}
              </button>
            )}

            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '12px', padding: '6px 12px' }}
              onClick={onNavigateToSetup}
            >
              Back to Test Setup
            </button>
          </div>
        </div>

        {/* Audit Metadata Strip */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-border-subtle)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} /> Created: {new Date(run.created_at).toLocaleTimeString()}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Sliders size={12} /> Decision Lever: <strong>{run.primary_lever}</strong>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={12} /> Profile Seed: <strong>#{run.profile_seed}</strong>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            Run ID: <code style={{ fontFamily: 'monospace' }}>{run.id.substring(0, 8)}</code>
          </span>
        </div>

        {/* Error or Incomplete Notice */}
        {run.error_message && (
          <div style={{ marginTop: 'var(--space-3)', background: 'var(--color-warning-bg)', border: '1px solid #FDE68A', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '12px', color: '#92400E', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <div>
              <strong>Notice: </strong>
              <span>{run.error_message}</span>
            </div>
          </div>
        )}
      </div>

      {/* Overview Comparison Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
        {/* Option A Response Card */}
        <div className="card" style={{ border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Option A (Baseline)
            </h3>
            <span className="badge badge-intended tabular-nums">
              {evalsA.length} / 50 Evaluated
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'center' }}>
            <div style={{ background: '#DCFCE7', borderRadius: 'var(--radius-md)', padding: '10px 4px' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#166534' }}>{countsA.interested}</div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#166534', textTransform: 'uppercase' }}>Interested</div>
            </div>
            <div style={{ background: '#FEF3C7', borderRadius: 'var(--radius-md)', padding: '10px 4px' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#92400E' }}>{countsA.unsure}</div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#92400E', textTransform: 'uppercase' }}>Unsure</div>
            </div>
            <div style={{ background: '#FEE2E2', borderRadius: 'var(--radius-md)', padding: '10px 4px' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#991B1B' }}>{countsA.not_interested}</div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#991B1B', textTransform: 'uppercase' }}>Not Int.</div>
            </div>
            <div style={{ background: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-md)', padding: '10px 4px' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-muted)' }}>{countsA.unavailable}</div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Unserved</div>
            </div>
          </div>
        </div>

        {/* Option B Response Card */}
        <div className="card" style={{ border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Option B (Alternative)
            </h3>
            <span className="badge badge-adjacent tabular-nums">
              {evalsB.length} / 50 Evaluated
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'center' }}>
            <div style={{ background: '#DCFCE7', borderRadius: 'var(--radius-md)', padding: '10px 4px' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#166534' }}>{countsB.interested}</div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#166534', textTransform: 'uppercase' }}>Interested</div>
            </div>
            <div style={{ background: '#FEF3C7', borderRadius: 'var(--radius-md)', padding: '10px 4px' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#92400E' }}>{countsB.unsure}</div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#92400E', textTransform: 'uppercase' }}>Unsure</div>
            </div>
            <div style={{ background: '#FEE2E2', borderRadius: 'var(--radius-md)', padding: '10px 4px' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#991B1B' }}>{countsB.not_interested}</div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#991B1B', textTransform: 'uppercase' }}>Not Int.</div>
            </div>
            <div style={{ background: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-md)', padding: '10px 4px' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-muted)' }}>{countsB.unavailable}</div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Unserved</div>
            </div>
          </div>
        </div>
      </div>

      {/* Paired Evaluations Table */}
      <div className="card" style={{ border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Paired Persona Evaluations
            </h3>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              Showing side-by-side responses and qualitative reasons across the frozen panel
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              Showing {profileIds.length} Personas
            </span>
          </div>
        </div>

        <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '8px 12px', fontWeight: 600, width: '70px' }}>ID</th>
                <th style={{ padding: '8px 12px', fontWeight: 600, width: '45%' }}>Option A Evaluation</th>
                <th style={{ padding: '8px 12px', fontWeight: 600, width: '45%' }}>Option B Evaluation</th>
              </tr>
            </thead>
            <tbody>
              {profileIds.map((profId, idx) => {
                const evalA = evalsA.find(e => e.profile_id === profId);
                const evalB = evalsB.find(e => e.profile_id === profId);

                const getResponseBadge = (ev?: Evaluation) => {
                  if (!ev) return <span className="badge badge-contrasting">Pending</span>;
                  const bg = ev.response === 'interested' ? '#DCFCE7' : ev.response === 'unsure' ? '#FEF3C7' : ev.response === 'not_interested' ? '#FEE2E2' : '#F1F5F9';
                  const color = ev.response === 'interested' ? '#166534' : ev.response === 'unsure' ? '#92400E' : ev.response === 'not_interested' ? '#991B1B' : '#475569';
                  return (
                    <span className="badge" style={{ background: bg, color, fontWeight: 600, textTransform: 'capitalize' }}>
                      {ev.response.replace('_', ' ')}
                    </span>
                  );
                };

                return (
                  <tr key={profId} style={{ borderBottom: '1px solid var(--color-border-subtle)', background: idx % 2 === 0 ? 'var(--color-surface)' : 'var(--color-surface-subtle)' }}>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 600, verticalAlign: 'top', color: 'var(--color-text-secondary)' }}>
                      {profId}
                    </td>
                    <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        {getResponseBadge(evalA)}
                        {evalA?.primary_objection && (
                          <span style={{ fontSize: '10px', color: '#991B1B', fontWeight: 500 }}>
                            Obj: {evalA.primary_objection}
                          </span>
                        )}
                      </div>
                      <p style={{ color: 'var(--color-text-primary)', fontSize: '11px', lineHeight: '1.4' }}>
                        {evalA?.reason || 'Evaluation pending...'}
                      </p>
                    </td>
                    <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        {getResponseBadge(evalB)}
                        {evalB?.primary_objection && (
                          <span style={{ fontSize: '10px', color: '#991B1B', fontWeight: 500 }}>
                            Obj: {evalB.primary_objection}
                          </span>
                        )}
                      </div>
                      <p style={{ color: 'var(--color-text-primary)', fontSize: '11px', lineHeight: '1.4' }}>
                        {evalB?.reason || 'Evaluation pending...'}
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
