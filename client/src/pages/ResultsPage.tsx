import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  RefreshCw, 
  ShieldCheck, 
  AlertCircle, 
  Sliders,
  ArrowLeft,
  FlaskConical,
  Globe,
  ExternalLink
} from 'lucide-react';
import { EmptyState } from '../components/Common/EmptyState.js';
import { ComparisonAnalysis } from '@droptest/shared';
import { DecisionCard } from '../components/Results/DecisionCard.js';
import { SingleLeverDiffBanner } from '../components/Results/SingleLeverDiffBanner.js';
import { BreakdownTable } from '../components/Results/BreakdownTable.js';
import { TransitionMatrixView } from '../components/Results/TransitionMatrixView.js';
import { PersonaTransitionTable } from '../components/Results/PersonaTransitionTable.js';
import { FinancialScenarioPanel } from '../components/Results/FinancialScenarioPanel.js';
import { RealFeedbackSection } from '../components/Results/RealFeedbackSection.js';
import { useAuth } from '../context/AuthContext.js';

interface ResultsPageProps {
  testId?: string;
  onNavigateToSetup: () => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({ testId, onNavigateToSetup }) => {
  const { token } = useAuth();
  const [analysis, setAnalysis] = useState<ComparisonAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchAnalysis = useCallback(async () => {
    if (!testId) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/tests/${testId}/analysis`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
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
  }, [testId, token]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  useEffect(() => {
    if (analysis?.run_status !== 'running' && analysis?.run_status !== 'pending') return;
    const timer = window.setInterval(fetchAnalysis, 1500);
    return () => window.clearInterval(timer);
  }, [analysis?.run_status, fetchAnalysis]);

  const handleRetryIncomplete = async () => {
    if (!testId || !analysis) return;
    setIsRetrying(true);
    try {
      const res = await fetch(`/api/tests/${testId}/runs/${analysis.run_id}/retry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        await fetchAnalysis();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Retry failed. Please try again.');
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
  if (errorMsg && !analysis) return (
    <div role="alert" className="workbench-card" style={{ maxWidth: '900px', margin: '40px auto' }}>
      <p>{errorMsg}</p>
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button className="btn btn-secondary" onClick={fetchAnalysis}>Try again</button>
        <button className="btn btn-secondary" onClick={onNavigateToSetup}>Back to setup</button>
      </div>
    </div>
  );

  if (!testId || !analysis) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        <EmptyState
          icon={BarChart3}
          title="No Simulation Run Available Yet"
          message="Simulated persona responses, breakdown by segment and market, and break-even calculations will appear here after executing a lab run."
          actionTitle="What you can do right now:"
          actionSteps={[
            'Open Synthetic Lab for your product in "My products" or "Set up test".',
            'Review the 20/20/10 panel distribution (20 intended / 20 adjacent / 10 contrasting) and audience markets.',
            'Click "Run product review" to execute the 50-persona simulation.'
          ]}
          primaryActionLabel="Go to Synthetic Lab Setup"
          onPrimaryAction={onNavigateToSetup}
        />
      </div>
    );
  }

  const isCompleted = analysis.decision_card.is_run_complete;
  const isComparison = analysis.mode === 'comparison' && Boolean(analysis.options.B) && Boolean(analysis.option_b_summary);
  const expectedCount = isComparison ? 100 : 50;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', paddingBottom: 'var(--space-8)' }}>
      {/* Workbench Header & Audit Status Bar */}
      <div className="card" style={{ marginBottom: 'var(--space-4)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {isComparison ? 'Comparison & Recommendation Workbench' : 'Synthetic Lab Product Review & Synthesis'}
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
                {isCompleted ? `Completed (${expectedCount} / ${expectedCount})` : `Incomplete (${analysis.decision_card.total_completed} / ${expectedCount})`}
              </span>
              <span 
                className="badge" 
                style={{ 
                  background: (analysis.references && analysis.references.length > 0) ? '#DCFCE7' : analysis.research_status === 'no_matches' ? '#F1F5F9' : '#FEF3C7', 
                  color: (analysis.references && analysis.references.length > 0) ? '#15803D' : analysis.research_status === 'no_matches' ? '#475569' : '#92400E', 
                  fontSize: '10px', 
                  fontWeight: 600 
                }}
              >
                {analysis.references && analysis.references.length > 0 
                  ? `Market Research Attached (${analysis.references.length} sources)` 
                  : analysis.research_status === 'no_matches' 
                    ? 'Research: No Direct Competitor Matches' 
                    : analysis.research_status === 'failed' 
                      ? 'Search Failed (Direct Run)'
                      : 'Direct Simulation (No Research)'}
              </span>
            </div>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              {isComparison 
                ? 'Paired comparison of Option A vs Option B across identical 50 buyer personas (20 intended / 20 adjacent / 10 contrasting)'
                : 'Single-product evaluation across 50 distinct buyer personas (20 intended / 20 adjacent / 10 contrasting)'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {!isCompleted && (
              <button
                type="button"
                className="btn btn-primary"
                style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={handleRetryIncomplete}
                disabled={isRetrying || analysis.run_status === 'running' || analysis.run_status === 'pending'}
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
              Back to Lab Setup
            </button>
          </div>
        </div>

        {/* Audit Metadata Strip */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-border-subtle)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
          {isComparison && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Sliders size={12} /> Decision Lever: <strong>{analysis.primary_lever.toUpperCase()}</strong>
            </span>
          )}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <FlaskConical size={12} /> Mode: <strong>{isComparison ? 'A/B Comparison (100 evals)' : 'Single Product Review (50 evals)'}</strong>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={12} /> Evaluator Model: <strong>{analysis.model_id || 'Not recorded'}</strong>
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
        financeB={isComparison ? analysis.finance_analysis.option_b : undefined}
      />

      {/* 2. Exact Single-Lever A -> B Diff (Comparison Mode Only) */}
      {isComparison && analysis.single_lever_diff && (
        <SingleLeverDiffBanner
          diffData={analysis.single_lever_diff}
          nameA={analysis.option_a_summary.option_name}
          nameB={analysis.option_b_summary?.option_name || 'Option B'}
        />
      )}

      {/* 3. Interest & Coverage Breakdown Table */}
      {(
        <>
          <BreakdownTable
            summaryA={analysis.option_a_summary}
            summaryB={isComparison ? analysis.option_b_summary : undefined}
            eligibilityChanges={analysis.eligibility_changes}
          />

          {/* 4. Paired A -> B Response Transitions (Comparison Mode Only) */}
          {isComparison && analysis.transition_matrix && (
            <TransitionMatrixView
              matrixData={analysis.transition_matrix}
              nameA={analysis.option_a_summary.option_name}
              nameB={analysis.option_b_summary?.option_name || 'Option B'}
            />
          )}
        </>
      )}

      {/* 5. Deterministic Financial Scenarios & Break-Even Analysis */}
      <FinancialScenarioPanel
        key={analysis.run_id}
        currency={analysis.currency}
        period={analysis.period}
        nameA={analysis.options.A.name}
        nameB={isComparison && analysis.options.B ? analysis.options.B.name : ''}
        priceA={analysis.options.A.price}
        priceB={isComparison && analysis.options.B ? analysis.options.B.price : 0}
        varCostA={analysis.options.A.variable_cost_per_sale}
        varCostB={isComparison && analysis.options.B ? analysis.options.B.variable_cost_per_sale : undefined}
        fixedCostA={analysis.options.A.fixed_launch_cost}
        fixedCostB={isComparison && analysis.options.B ? analysis.options.B.fixed_launch_cost : undefined}
        capacityA={analysis.options.A.capacity_units}
        capacityB={isComparison && analysis.options.B ? analysis.options.B.capacity_units : undefined}
        financeA={analysis.finance_analysis.option_a}
        hasOptionB={isComparison}
        financeB={isComparison ? analysis.finance_analysis.option_b : undefined}
      />

      {/* 5.5 Market Research & Comparable Alternatives (Stage 5) */}
      {analysis.references && analysis.references.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--space-4)', border: '1px solid var(--color-border)', padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={16} color="var(--color-primary)" />
              <h4 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, margin: 0, color: 'var(--color-text-primary)' }}>
                Market Research & Comparable Alternatives ({analysis.references.length})
              </h4>
            </div>
            <span className="badge" style={{ background: '#DCFCE7', color: '#15803D', fontWeight: 600, fontSize: '11px' }}>
              Research: Completed ({analysis.references.length} references)
            </span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
            These live market references were frozen with this simulation run and provided as context to persona evaluations.
          </p>
          {analysis.reference_summary && (
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '11px', lineHeight: 1.5, background: '#F8FAFC', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '10px', marginBottom: '12px' }}>
              {analysis.reference_summary}
            </pre>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
            {analysis.references.map((ref, idx) => (
              <div key={ref.id} style={{ background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)' }}>[REF-{idx + 1}]</span>
                  <span style={{ fontSize: '10px', background: ref.evidence_type === 'founder_manual_note' ? '#F3E8FF' : '#E0F2FE', color: ref.evidence_type === 'founder_manual_note' ? '#6B21A8' : '#0369A1', padding: '1px 5px', borderRadius: '3px', fontWeight: 600 }}>
                    {ref.evidence_type === 'founder_manual_note' ? 'Founder Note' : 'Retrieved Snippet'}
                  </span>
                </div>
                <a href={ref.url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {ref.title} <ExternalLink size={11} color="var(--color-primary)" />
                </a>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{ref.domain}</span>
                <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                  {ref.supported_facts && ref.supported_facts.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '14px' }}>
                      {ref.supported_facts.map((fact, fIdx) => (
                        <li key={fIdx}>{fact}</li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ margin: 0 }}>{ref.snippet_or_fact}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. 50-Persona Drill-down Response Table */}
      <PersonaTransitionTable
        transitions={analysis.transitions}
        nameA={analysis.option_a_summary.option_name}
        nameB={isComparison ? analysis.option_b_summary?.option_name : undefined}
        references={analysis.references || []}
      />

      {/* 7. Real Person Feedback Section (Distinguished from Simulated 50 Personas) */}
      <RealFeedbackSection
        testId={analysis.test_id}
        productId={analysis.product_id}
        showLegacyFeedback={isComparison}
      />
    </div>
  );
};
