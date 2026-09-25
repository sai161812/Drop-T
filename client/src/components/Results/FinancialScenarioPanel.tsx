import React, { useState } from 'react';
import { 
  FinancialCalculationResult, 
  calculateFinancials 
} from '@droptest/shared';
import { 
  DollarSign, 
  Calculator 
} from 'lucide-react';

interface FinancialScenarioPanelProps {
  currency: string;
  period: string;
  nameA: string;
  nameB?: string;
  hasOptionB?: boolean;
  priceA: number;
  priceB: number;
  varCostA?: number;
  varCostB?: number;
  fixedCostA?: number;
  fixedCostB?: number;
  capacityA?: number;
  capacityB?: number;
  financeA: FinancialCalculationResult;
  financeB?: FinancialCalculationResult;
}

export const FinancialScenarioPanel: React.FC<FinancialScenarioPanelProps> = ({
  currency,
  period,
  nameA,
  nameB,
  hasOptionB = Boolean(nameB),
  priceA,
  priceB,
  varCostA,
  varCostB,
  fixedCostA,
  fixedCostB,
  capacityA,
  capacityB,
  financeA,
  financeB
}) => {
  // Local interactive scenario units state (defaults or user-adjusted)
  const [lowerUnits, setLowerUnits] = useState<number | undefined>(financeA.scenarios?.lower?.units);
  const [centralUnits, setCentralUnits] = useState<number | undefined>(financeA.scenarios?.central?.units);
  const [higherUnits, setHigherUnits] = useState<number | undefined>(financeA.scenarios?.higher?.units);

  const hasCostsA = financeA.has_sufficient_inputs;
  const hasCostsB = hasOptionB && Boolean(financeB?.has_sufficient_inputs);

  // Live calculation based on current user-entered scenario units
  const liveFinanceA = calculateFinancials({
    currency,
    period,
    price: priceA,
    variable_cost_per_sale: varCostA,
    fixed_launch_cost: fixedCostA,
    capacity_units: capacityA,
    sales_scenarios: {
      lower_units: lowerUnits,
      central_units: centralUnits,
      higher_units: higherUnits
    }
  });

  const liveFinanceB = calculateFinancials({
    currency,
    period,
    price: hasOptionB ? priceB : priceA,
    variable_cost_per_sale: varCostB,
    fixed_launch_cost: fixedCostB,
    capacity_units: capacityB,
    sales_scenarios: {
      lower_units: lowerUnits,
      central_units: centralUnits,
      higher_units: higherUnits
    }
  });

  const periodLabels: Record<string, string> = {
    launch_batch: 'Initial Launch Batch',
    first_month: 'First Operating Month',
    per_item: 'Per Production Run'
  };

  const formattedPeriod = periodLabels[period] || period.replace(/_/g, ' ');

  // If both options are missing financial cost inputs
  if (!hasCostsA && !hasCostsB) {
    return (
      <div 
        className="card" 
        style={{ 
          marginBottom: 'var(--space-5)', 
          border: '1px solid var(--color-border)', 
          background: 'var(--color-surface)',
          padding: 'var(--space-4)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-3)' }}>
          <DollarSign size={16} style={{ color: 'var(--color-text-secondary)' }} />
          <h4 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Financial Scenarios & Break-Even Analysis
          </h4>
        </div>

        <div 
          style={{ 
            background: 'var(--color-surface-subtle)', 
            border: '1px dashed var(--color-border)', 
            borderRadius: 'var(--radius-md)', 
            padding: '20px', 
            textAlign: 'center' 
          }}
        >
          <Calculator size={24} style={{ color: 'var(--color-text-muted)', margin: '0 auto 8px auto' }} />
          <h5 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
            Add Costs in Setup to Calculate Break-Even Units
          </h5>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', maxWidth: '500px', margin: '0 auto 8px auto', lineHeight: 1.45 }}>
            No placeholder numbers or fabricated margins are displayed. Enter your fixed launch cost and unit production/delivery cost in Test Setup to see deterministic break-even units and net scenarios.
          </p>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            Missing inputs: <strong>Variable cost per sale (C)</strong> and <strong>Fixed launch cost (F)</strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="card" 
      style={{ 
        marginBottom: 'var(--space-5)', 
        border: '1px solid var(--color-border)', 
        background: 'var(--color-surface)',
        padding: 'var(--space-4)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={16} style={{ color: 'var(--color-success)' }} />
            <h4 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Deterministic Financial Scenarios & Break-Even
            </h4>
          </div>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            Consistent Accounting Period: <strong>{formattedPeriod}</strong> ({currency})
          </p>
        </div>

        <span className="badge badge-intended" style={{ fontSize: '10px' }}>
          Deterministic Arithmetic
        </span>
      </div>

      {/* Break-Even Cards (Option A vs Option B) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
        {/* Option A Economics */}
        <div style={{ background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Option A ({nameA})
            </span>
            <span className="tabular-nums" style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              Price: {currency} {priceA}
            </span>
          </div>

          {hasCostsA ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '10px', textAlign: 'center' }}>
                <div style={{ background: 'var(--color-surface)', padding: '6px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-subtle)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Unit Cost (C)</div>
                  <div style={{ fontSize: '12px', fontWeight: 600 }} className="tabular-nums">{currency} {varCostA}</div>
                </div>
                <div style={{ background: 'var(--color-surface)', padding: '6px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-subtle)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Contribution</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: (liveFinanceA.contribution_per_sale || 0) > 0 ? '#166534' : '#991B1B' }} className="tabular-nums">
                    {currency} {liveFinanceA.contribution_per_sale}
                  </div>
                </div>
                <div style={{ background: 'var(--color-surface)', padding: '6px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-subtle)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Fixed Cost (F)</div>
                  <div style={{ fontSize: '12px', fontWeight: 600 }} className="tabular-nums">{currency} {fixedCostA}</div>
                </div>
              </div>

              {/* Break Even Status */}
              <div style={{ background: liveFinanceA.break_even_units !== null ? '#DCFCE7' : '#FEE2E2', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 600, color: liveFinanceA.break_even_units !== null ? '#166534' : '#991B1B' }}>
                  Required Break-Even Units
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: liveFinanceA.break_even_units !== null ? '#166534' : '#991B1B', margin: '2px 0' }} className="tabular-nums">
                  {liveFinanceA.break_even_units !== null ? `${liveFinanceA.break_even_units} units` : 'No Break-Even'}
                </div>
                {liveFinanceA.break_even_status_message && (
                  <div style={{ fontSize: '10px', color: '#991B1B', fontWeight: 500 }}>
                    {liveFinanceA.break_even_status_message}
                  </div>
                )}
                {capacityA && (
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Capacity Ceiling: {capacityA} units
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', padding: '10px 0' }}>
              Costs not entered for Option A.
            </div>
          )}
        </div>

        {hasOptionB && <>
        {/* Option B Economics */}
        <div style={{ background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-accent)' }}>
              Option B ({nameB})
            </span>
            <span className="tabular-nums" style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              Price: {currency} {priceB}
            </span>
          </div>

          {hasCostsB ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '10px', textAlign: 'center' }}>
                <div style={{ background: 'var(--color-surface)', padding: '6px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-subtle)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Unit Cost (C)</div>
                  <div style={{ fontSize: '12px', fontWeight: 600 }} className="tabular-nums">{currency} {varCostB}</div>
                </div>
                <div style={{ background: 'var(--color-surface)', padding: '6px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-subtle)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Contribution</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: (liveFinanceB.contribution_per_sale || 0) > 0 ? '#166534' : '#991B1B' }} className="tabular-nums">
                    {currency} {liveFinanceB.contribution_per_sale}
                  </div>
                </div>
                <div style={{ background: 'var(--color-surface)', padding: '6px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-subtle)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Fixed Cost (F)</div>
                  <div style={{ fontSize: '12px', fontWeight: 600 }} className="tabular-nums">{currency} {fixedCostB}</div>
                </div>
              </div>

              {/* Break Even Status */}
              <div style={{ background: liveFinanceB.break_even_units !== null ? '#DCFCE7' : '#FEE2E2', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 600, color: liveFinanceB.break_even_units !== null ? '#166534' : '#991B1B' }}>
                  Required Break-Even Units
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: liveFinanceB.break_even_units !== null ? '#166534' : '#991B1B', margin: '2px 0' }} className="tabular-nums">
                  {liveFinanceB.break_even_units !== null ? `${liveFinanceB.break_even_units} units` : 'No Break-Even'}
                </div>
                {liveFinanceB.break_even_status_message && (
                  <div style={{ fontSize: '10px', color: '#991B1B', fontWeight: 500 }}>
                    {liveFinanceB.break_even_status_message}
                  </div>
                )}
                {capacityB && (
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Capacity Ceiling: {capacityB} units
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', padding: '10px 0' }}>
              Costs not entered for Option B.
            </div>
          )}
        </div>
        </>}
      </div>

      {/* Interactive Sales Scenario Matrix */}
      <div style={{ border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)', padding: '14px', background: 'var(--color-surface-subtle)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              "If You Sell Q Units" — User-Entered Scenarios
            </span>
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: 0 }}>
              Conditional arithmetic for your entered unit scenarios. Never inferred from the 50 simulated profiles.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Adjust Q:</span>
            <input
              type="number"
              className="input tabular-nums"
              value={lowerUnits ?? ''}
              onChange={e => setLowerUnits(e.target.value === '' ? undefined : Number(e.target.value))}
              style={{ width: '60px', height: '28px', fontSize: '11px', padding: '2px 6px', textAlign: 'center' }}
              title="Lower scenario units"
            />
            <input
              type="number"
              className="input tabular-nums"
              value={centralUnits ?? ''}
              onChange={e => setCentralUnits(e.target.value === '' ? undefined : Number(e.target.value))}
              style={{ width: '60px', height: '28px', fontSize: '11px', padding: '2px 6px', textAlign: 'center' }}
              title="Central scenario units"
            />
            <input
              type="number"
              className="input tabular-nums"
              value={higherUnits ?? ''}
              onChange={e => setHigherUnits(e.target.value === '' ? undefined : Number(e.target.value))}
              style={{ width: '60px', height: '28px', fontSize: '11px', padding: '2px 6px', textAlign: 'center' }}
              title="Higher scenario units"
            />
          </div>
        </div>

        {/* Scenarios Table */}
        <div style={{ overflowX: 'auto', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>Scenario</th>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>Units ($Q$)</th>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>Option A Net Profit / Loss</th>
                {hasOptionB && <th style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--color-accent)' }}>Option B Net Profit / Loss</th>}
                {hasOptionB && <th style={{ padding: '8px 10px', fontWeight: 600, textAlign: 'right' }}>Variance (B minus A)</th>}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Lower Volume', scA: liveFinanceA.scenarios?.lower, scB: hasOptionB ? liveFinanceB.scenarios?.lower : undefined },
                { label: 'Central Volume', scA: liveFinanceA.scenarios?.central, scB: hasOptionB ? liveFinanceB.scenarios?.central : undefined },
                { label: 'Higher Volume', scA: liveFinanceA.scenarios?.higher, scB: hasOptionB ? liveFinanceB.scenarios?.higher : undefined }
              ].map((row, idx) => {
                const netA = row.scA?.net_result;
                const netB = row.scB?.net_result;
                const variance = netA !== undefined && netB !== undefined ? netB - netA : undefined;

                return (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {row.label}
                    </td>
                    <td style={{ padding: '8px 10px', color: 'var(--color-text-secondary)' }} className="tabular-nums">
                      {row.scA?.units ?? '–'} units
                    </td>
                    <td style={{ padding: '8px 10px' }} className="tabular-nums">
                      {row.scA?.is_valid ? (
                        <span style={{ fontWeight: 600, color: (netA || 0) >= 0 ? '#166534' : '#991B1B' }}>
                          {currency} {netA}
                        </span>
                      ) : (
                        <span style={{ color: '#991B1B', fontSize: '10px' }}>
                          {row.scA?.validation_error || 'Invalid scenario'}
                        </span>
                      )}
                    </td>
                    {hasOptionB && <td style={{ padding: '8px 10px' }} className="tabular-nums">
                      {row.scB?.is_valid ? (
                        <span style={{ fontWeight: 600, color: (netB || 0) >= 0 ? '#166534' : '#991B1B' }}>
                          {currency} {netB}
                        </span>
                      ) : (
                        <span style={{ color: '#991B1B', fontSize: '10px' }}>
                          {row.scB?.validation_error || 'Invalid scenario'}
                        </span>
                      )}
                    </td>}
                    {hasOptionB && <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }} className="tabular-nums">
                      {variance !== undefined ? (
                        <span style={{ color: variance >= 0 ? '#166534' : '#991B1B' }}>
                          {variance >= 0 ? `+${currency} ${variance}` : `${currency} ${variance}`}
                        </span>
                      ) : '–'}
                    </td>}
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
