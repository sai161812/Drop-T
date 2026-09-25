import React from 'react';
import { 
  Users, 
  MapPin, 
  Sliders, 
  Play, 
  AlertTriangle, 
  CheckCircle2,
  Lock
} from 'lucide-react';
import { 
  PrimaryLever, 
  PRIMARY_LEVER_LABELS 
} from '@droptest/shared';

interface AssumptionSummaryProps {
  mode?: 'single' | 'comparison';
  audienceMarkets: string[];
  servedMarketsA: string[];
  servedMarketsB?: string[];
  intendedBuyer: string;
  adjacentBuyer: string;
  expectedSpendMin: number;
  expectedSpendMax: number;
  currency: string;
  comparisonLever?: PrimaryLever;
  priceA: number;
  priceB?: number;
  missingInputs: string[];
  isValid: boolean;
  onRunSimulation?: () => void;
  isSubmitting?: boolean;
}

export const AssumptionSummary: React.FC<AssumptionSummaryProps> = ({
  mode = 'single',
  audienceMarkets,
  servedMarketsA,
  servedMarketsB = [],
  intendedBuyer: _intendedBuyer,
  adjacentBuyer: _adjacentBuyer,
  expectedSpendMin,
  expectedSpendMax,
  currency,
  comparisonLever = 'price',
  priceA,
  priceB,
  missingInputs,
  isValid,
  onRunSimulation,
  isSubmitting
}) => {
  const isSingle = mode === 'single';

  return (
    <aside className="sidebar-column" aria-label="Simulated Panel Assumptions">
      {/* Primary 50 Profile Panel Preview */}
      <div className="workbench-card">
        <div className="card-header" style={{ marginBottom: 'var(--space-2)' }}>
          <h2 className="card-title" style={{ fontSize: 'var(--font-size-sm)' }}>
            <Users size={16} />
            <span>Simulated Panel (50 Profiles)</span>
          </h2>
          <span className="badge badge-intended tabular-nums">50 Total Personas</span>
        </div>

        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
          Fixed 20/20/10 allocation across intended, adjacent, and contrasting segments.
        </p>

        {/* Visual 20/20/10 Segment Bar */}
        <div className="panel-distribution-bar" title="Panel Split: 20 Intended / 20 Adjacent / 10 Contrasting">
          <div className="panel-seg-intended" />
          <div className="panel-seg-adjacent" />
          <div className="panel-seg-contrasting" />
        </div>

        {/* Segment Breakdown */}
        <div style={{ marginTop: '8px' }}>
          <div className="panel-stat-row">
            <span className="panel-stat-label">
              <span className="badge badge-intended" style={{ padding: '1px 5px' }}>20</span>
              <span>Intended Segment</span>
            </span>
            <span className="panel-stat-val">40%</span>
          </div>
          <div className="panel-stat-row">
            <span className="panel-stat-label">
              <span className="badge badge-adjacent" style={{ padding: '1px 5px' }}>20</span>
              <span>Adjacent Segment</span>
            </span>
            <span className="panel-stat-val">40%</span>
          </div>
          <div className="panel-stat-row">
            <span className="panel-stat-label">
              <span className="badge badge-contrasting" style={{ padding: '1px 5px' }}>10</span>
              <span>Contrasting Segment</span>
            </span>
            <span className="panel-stat-val">20%</span>
          </div>
        </div>

        {/* Spend Range Context */}
        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--color-border-subtle)', fontSize: 'var(--font-size-xs)' }}>
          <div className="panel-stat-row" style={{ borderBottom: 'none' }}>
            <span className="panel-stat-label">Expected Spend Band:</span>
            <span className="panel-stat-val tabular-nums">
              {currency} {expectedSpendMin} – {expectedSpendMax}
            </span>
          </div>
        </div>
      </div>

      {/* Market Eligibility Summary */}
      <div className="workbench-card">
        <div className="card-header" style={{ marginBottom: 'var(--space-2)' }}>
          <h2 className="card-title" style={{ fontSize: 'var(--font-size-sm)' }}>
            <MapPin size={16} />
            <span>Audience & Coverage</span>
          </h2>
          <span className="badge" style={{ background: 'var(--color-surface-subtle)', color: 'var(--color-text-secondary)' }}>
            {audienceMarkets.length} {audienceMarkets.length === 1 ? 'Market' : 'Markets'}
          </span>
        </div>

        {audienceMarkets.length === 0 ? (
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            No audience markets defined yet. Add up to 4 regions in Step 2.
          </p>
        ) : (
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
              Deterministic reachability across options:
            </div>
            {audienceMarkets.map((market, idx) => {
              const inA = servedMarketsA.includes(market);
              const inB = servedMarketsB.includes(market);
              return (
                <div key={idx} className="panel-stat-row" style={{ padding: '4px 0' }}>
                  <span className="panel-stat-label" style={{ fontSize: '12px' }}>{market}</span>
                  <div style={{ display: 'flex', gap: '6px', fontSize: '10px' }}>
                    <span style={{ padding: '1px 4px', borderRadius: '2px', background: inA ? '#DCFCE7' : '#FEE2E2', color: inA ? '#166534' : '#991B1B' }}>
                      {isSingle ? (inA ? 'Served' : 'Unserved') : `A: ${inA ? 'Served' : 'Unserved'}`}
                    </span>
                    {!isSingle && (
                      <span style={{ padding: '1px 4px', borderRadius: '2px', background: inB ? '#DCFCE7' : '#FEE2E2', color: inB ? '#166534' : '#991B1B' }}>
                        B: {inB ? 'Served' : 'Unserved'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Comparison Lever Overview (only in comparison mode) */}
      {!isSingle && (
        <div className="workbench-card">
          <div className="card-header" style={{ marginBottom: 'var(--space-2)' }}>
            <h2 className="card-title" style={{ fontSize: 'var(--font-size-sm)' }}>
              <Sliders size={16} />
              <span>Decision Lever</span>
            </h2>
            <span className="badge" style={{ background: '#FEF3C7', color: '#92400E' }}>
              {PRIMARY_LEVER_LABELS[comparisonLever]}
            </span>
          </div>

          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
            {comparisonLever === 'price' && `Testing price elasticity: Option A (${currency} ${priceA}) vs Option B (${currency} ${priceB}).`}
            {comparisonLever === 'message' && 'Testing value proposition and positioning message resonance.'}
            {comparisonLever === 'served_markets' && 'Testing geographic accessibility and fulfillment coverage trade-offs.'}
            {comparisonLever === 'creative' && 'Testing packaging, presentation, and visual creative appeal.'}
          </p>
        </div>
      )}

      {/* Checklist & Run Action Card */}
      <div className="workbench-card" style={{ background: isValid ? 'var(--color-surface)' : 'var(--color-surface-subtle)' }}>
        <h3 style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
          Simulation Readiness
        </h3>

        {missingInputs.length > 0 ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--font-size-xs)', color: 'var(--color-warning)', fontWeight: 500, marginBottom: '6px' }}>
              <AlertTriangle size={14} />
              <span>Missing or invalid requirements ({missingInputs.length}):</span>
            </div>
            <ul className="missing-checklist">
              {missingInputs.map((item, idx) => (
                <li key={idx} className="missing-item">
                  <span>&bull;</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--font-size-xs)', color: 'var(--color-success)', marginBottom: '12px' }}>
            <CheckCircle2 size={16} />
            <span>All required inputs ready for 50-profile evaluation.</span>
          </div>
        )}

        <button
          type="button"
          className="btn btn-primary btn-large"
          style={{ marginTop: 'var(--space-4)' }}
          disabled={!isValid || isSubmitting}
          onClick={onRunSimulation}
          title={!isValid ? 'Fill all mandatory inputs above to enable simulation' : isSingle ? 'Run product review (50 simulated profiles)' : 'Run comparative review (100 simulated profiles)'}
        >
          {!isValid ? <Lock size={15} /> : <Play size={16} />}
          <span>{isSingle ? 'Run product review' : 'Run 50 simulated profiles'}</span>
        </button>

        <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '8px', lineHeight: '1.3' }}>
          {isSingle 
            ? 'Evaluates 50 simulated profiles against your product.' 
            : 'Executes 100 evaluations (Option A & Option B across the same 50 personas).'}
        </p>
      </div>
    </aside>
  );
};
