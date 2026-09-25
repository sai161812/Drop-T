import React from 'react';
import { 
  DecisionCardData, 
  PrimaryLever, 
  FinancialCalculationResult 
} from '@droptest/shared';
import { 
  Compass, 
  AlertTriangle, 
  ShieldAlert, 
  MapPin, 
  FileQuestion, 
  DollarSign, 
  TrendingUp, 
  Info 
} from 'lucide-react';

interface DecisionCardProps {
  data: DecisionCardData;
  lever: PrimaryLever;
  financeA?: FinancialCalculationResult;
  financeB?: FinancialCalculationResult;
}

export const DecisionCard: React.FC<DecisionCardProps> = ({
  data,
  lever
}) => {
  const isComplete = data.is_run_complete;

  return (
    <div 
      className="card" 
      style={{ 
        border: '1px solid var(--color-border)', 
        boxShadow: 'var(--shadow-md)', 
        marginBottom: 'var(--space-5)',
        background: 'var(--color-surface)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Top Accent Bar */}
      <div 
        style={{ 
          height: '4px', 
          width: '100%', 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          background: !isComplete 
            ? 'var(--color-warning)' 
            : data.winner_declared 
              ? 'var(--color-accent)' 
              : '#64748B' 
        }} 
      />

      {/* Incomplete / Partial Run Warning */}
      {!isComplete && (
        <div 
          style={{ 
            background: 'var(--color-warning-bg)', 
            border: '1px solid #FDE68A', 
            borderRadius: 'var(--radius-md)', 
            padding: '12px 16px', 
            marginBottom: 'var(--space-4)', 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: '10px' 
          }}
        >
          <AlertTriangle size={18} style={{ color: '#B45309', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 600, color: '#92400E', fontSize: '13px' }}>
              Incomplete Simulation Run ({data.total_completed} / {data.total_expected} Evaluations)
            </div>
            <p style={{ color: '#B45309', fontSize: '12px', marginTop: '2px' }}>
              Results are partial. Bounded retries target missing evaluations without altering existing responses. Please retry before picking a winning option.
            </p>
          </div>
        </div>
      )}

      {/* Header: Practical Next Test Recommendation */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span 
            className="badge" 
            style={{ 
              background: '#EEF2FF', 
              color: '#3730A3', 
              fontWeight: 600, 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '4px',
              fontSize: '11px',
              padding: '3px 8px'
            }}
          >
            <Compass size={13} />
            Recommended Next Test
          </span>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            Lever: <strong>{lever.toUpperCase()}</strong>
          </span>
        </div>

        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>
          {data.recommended_next_test}
        </h3>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
          {data.status_headline}
        </p>
      </div>

      {/* 2-Column Grid: Simulated Observation & Leading Objection */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        {/* Key Simulated Observation */}
        <div 
          style={{ 
            background: 'var(--color-surface-subtle)', 
            border: '1px solid var(--color-border-subtle)', 
            borderRadius: 'var(--radius-md)', 
            padding: '12px 14px' 
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>
            <TrendingUp size={13} style={{ color: 'var(--color-accent)' }} />
            Key Simulated Observation
          </div>
          <p style={{ fontSize: '12px', color: 'var(--color-text-primary)', lineHeight: 1.45, fontWeight: 500 }}>
            {data.key_simulated_observation}
          </p>
        </div>

        {/* Leading Objection */}
        <div 
          style={{ 
            background: 'var(--color-surface-subtle)', 
            border: '1px solid var(--color-border-subtle)', 
            borderRadius: 'var(--radius-md)', 
            padding: '12px 14px' 
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>
            <ShieldAlert size={13} style={{ color: '#DC2626' }} />
            Leading Persona Friction
          </div>
          <p style={{ fontSize: '12px', color: '#991B1B', lineHeight: 1.45, fontWeight: 500 }}>
            {data.leading_objection}
          </p>
        </div>
      </div>

      {/* Caveats & Evidence Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        {/* Location / Access Caveat */}
        <div 
          style={{ 
            background: '#F8FAFC', 
            border: '1px solid #E2E8F0', 
            borderRadius: 'var(--radius-md)', 
            padding: '10px 12px',
            fontSize: '11px',
            color: '#334155'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, marginBottom: '2px', color: '#0F172A' }}>
            <MapPin size={12} style={{ color: 'var(--color-accent)' }} />
            Location & Access Caveat
          </div>
          <p style={{ lineHeight: 1.4 }}>{data.location_access_caveat}</p>
        </div>

        {/* Missing Evidence Required Before Launch */}
        <div 
          style={{ 
            background: '#F8FAFC', 
            border: '1px solid #E2E8F0', 
            borderRadius: 'var(--radius-md)', 
            padding: '10px 12px',
            fontSize: '11px',
            color: '#334155'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, marginBottom: '2px', color: '#0F172A' }}>
            <FileQuestion size={12} style={{ color: '#D97706' }} />
            Evidence Still Missing
          </div>
          <p style={{ lineHeight: 1.4 }}>{data.missing_evidence}</p>
        </div>
      </div>

      {/* Finance Scenario Connection */}
      <div 
        style={{ 
          background: 'var(--color-surface-subtle)', 
          border: '1px solid var(--color-border-subtle)', 
          borderRadius: 'var(--radius-md)', 
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DollarSign size={16} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
          <div>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
              Break-Even Reality Check
            </span>
            <p style={{ fontSize: '12px', color: 'var(--color-text-primary)', marginTop: '1px' }}>
              {data.finance_comparison?.note || 'Add launch costs in Setup to calculate required break-even units.'}
            </p>
          </div>
        </div>

        {data.finance_comparison?.has_finance && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ textAlign: 'right', fontSize: '11px' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Option A: </span>
              <strong className="tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                {data.finance_comparison.break_even_a ?? 'N/A'} units
              </strong>
            </div>
            <div style={{ textAlign: 'right', fontSize: '11px' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Option B: </span>
              <strong className="tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                {data.finance_comparison.break_even_b ?? 'N/A'} units
              </strong>
            </div>
          </div>
        )}
      </div>

      {/* Strict PRD Truthful Notice Footer */}
      <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'var(--color-text-muted)' }}>
        <Info size={11} />
        <span>
          Simulated interest reflects grounded persona reactions against entered product specs. It does not constitute a prediction of real buyer sales volume.
        </span>
      </div>
    </div>
  );
};
