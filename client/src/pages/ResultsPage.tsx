import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  RefreshCw, 
  ShieldCheck, 
  AlertCircle, 
  Sliders,
  ArrowLeft
} from 'lucide-react';
import { EmptyState } from '../components/Common/EmptyState.js';
import { ComparisonAnalysis } from '@droptest/shared';
import { DecisionCard } from '../components/Results/DecisionCard.js';
import { SingleLeverDiffBanner } from '../components/Results/SingleLeverDiffBanner.js';
import { BreakdownTable } from '../components/Results/BreakdownTable.js';
import { TransitionMatrixView } from '../components/Results/TransitionMatrixView.js';
import { PersonaTransitionTable } from '../components/Results/PersonaTransitionTable.js';
import { RealFeedbackSection } from '../components/Results/RealFeedbackSection.js';

interface ResultsPageProps {
  testId?: string;
  onNavigateToSetup: () => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({ testId, onNavigateToSetup }) => {
  const [analysis, setAnalysis] = useState<ComparisonAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchAnalysis = useCallback(async () => {
    if (!testId) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/tests/${testId}/analysis`);
      if (res.ok) {
        const data = await res.json();
        if (data.analysis === null) {
          setAnalysis(null);
        } else {
          setAnalysis(data);
        }
      } else {
        const err = await res.json();
        setErrorMsg(err.message || 'Failed to load comparison analysis');
      }
    } catch (e: any) {
      console.error('Failed to fetch analysis:', e);
      setErrorMsg(e.message || 'Network error loading results');
    } finally {
      setIsLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  const handleRetryIncomplete = async () => {
    if (!testId || !analysis) return;
    setIsRetrying(true);
    try {
      const res = await fetch(`/api/tests/${testId}/runs/${analysis.run_id}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        await fetchAnalysis();
      }
    } catch (e) {
      console.error('Retry failed:', e);
    } finally {
      setIsRetrying(false);
    }
  };

  // If loading without cached analysis
  if (isLoading && !analysis) {
    return (
      <div style={{ maxWidth: '900px', margin: '60px auto', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
        Loading verified simulation results and synthesis...
      </div>
    );
  }

  // If no test or no run exists
  if (!testId || !analysis) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        <EmptyState
          icon={BarChart3}
          title="No Simulation Run Available Yet"
          message="Simulated comparative results, paired persona transitions, and break-even comparison will appear here after executing a test run."
          actionTitle="What you can do right now:"
          actionSteps={[
            'Navigate to "Set up test" to configure your domain, offering, and baseline (Option A).',
            'Select your primary comparison lever (Price, Message, Served Markets, or Creative) and configure Option B.',
            'Review the 20/20/10 panel distribution (20 intended / 20 adjacent / 10 contrasting) and audience markets.',
            'Click "Run 50 simulated profiles" to execute the 100-evaluation paired simulation.'
          ]}
          primaryActionLabel="Go to Set up test"
          onPrimaryAction={onNavigateToSetup}
        />
      </div>
    );
  }

  const isCompleted = analysis.decision_card.is_run_complete;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', paddingBottom: 'var(--space-8)' }}>
      {/* Workbench Header & Audit Status Bar */}
      <div className="card" style={{ marginBottom: 'var(--space-4)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Comparison & Recommendation Workbench
              </h2>
              <span 
                className="badge" 
                style={{ 
                  background: isCompleted ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
                  color: isCompleted ? 'var(--color-success)' : 'var(--color-warning)',
                  fontWeight: 600,
                  textTransform: 'capitalize'
                }}
              >
                {isCompleted ? 'Completed (100 / 100)' : `Incomplete (${analysis.decision_card.total_completed} / 100)`}
              </span>
            </div>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Paired comparison of Option A vs Option B across identical 50 buyer personas (20 intended / 20 adjacent / 10 contrasting)
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {!isCompleted && (
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
              style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={onNavigateToSetup}
            >
              <ArrowLeft size={13} />
              Back to Test Setup
            </button>
          </div>
        </div>

        {/* Audit Metadata Strip */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-border-subtle)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Sliders size={12} /> Decision Lever: <strong>{analysis.primary_lever.toUpperCase()}</strong>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={12} /> Evaluator Model: <strong>{analysis.model_id || 'openai/gpt-oss-120b'}</strong>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            Run ID: <code style={{ fontFamily: 'monospace' }}>{analysis.run_id.substring(0, 8)}</code>
          </span>
        </div>

        {errorMsg && (
          <div style={{ marginTop: 'var(--space-3)', background: 'var(--color-danger-bg)', border: '1px solid #FECACA', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '12px', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* 1. Top Decision Card */}
      <DecisionCard
        data={analysis.decision_card}
        lever={analysis.primary_lever}
        financeA={analysis.finance_analysis.option_a}
        financeB={analysis.finance_analysis.option_b}
      />

      {/* 2. Exact Single-Lever A -> B Diff */}
      <SingleLeverDiffBanner
        diffData={analysis.single_lever_diff}
        nameA={analysis.option_a_summary.option_name}
        nameB={analysis.option_b_summary.option_name}
      />

      {/* 3. Interest & Coverage Breakdown Table */}
      <BreakdownTable
        summaryA={analysis.option_a_summary}
        summaryB={analysis.option_b_summary}
        eligibilityChanges={analysis.eligibility_changes}
      />

      {/* 4. Paired A -> B Response Transitions */}
      <TransitionMatrixView
        matrixData={analysis.transition_matrix}
        nameA={analysis.option_a_summary.option_name}
        nameB={analysis.option_b_summary.option_name}
      />

      {/* 5. 50-Persona Drill-down Response Table */}
      <PersonaTransitionTable
        transitions={analysis.transitions}
        nameA={analysis.option_a_summary.option_name}
        nameB={analysis.option_b_summary.option_name}
      />

      {/* 6. Real Person Feedback Section (Truthful Empty State until Phase 6) */}
      <RealFeedbackSection
        testId={analysis.test_id}
      />
    </div>
  );
};
