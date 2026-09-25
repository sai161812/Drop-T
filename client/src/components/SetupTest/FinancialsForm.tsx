import React from 'react';
import { Calculator, AlertCircle } from 'lucide-react';
import { calculateFinancials } from '@droptest/shared';

interface FinancialsFormProps {
  currency: string;
  period: string;
  priceA: number;
  priceB: number;
  variableCostA?: number;
  onChangeVariableCostA: (val?: number) => void;
  variableCostB?: number;
  onChangeVariableCostB: (val?: number) => void;
  fixedCost?: number;
  onChangeFixedCost: (val?: number) => void;
  capacityUnits?: number;
  onChangeCapacityUnits: (val?: number) => void;
  lowerUnits?: number;
  onChangeLowerUnits: (val?: number) => void;
  centralUnits?: number;
  onChangeCentralUnits: (val?: number) => void;
  higherUnits?: number;
  onChangeHigherUnits: (val?: number) => void;
}

export const FinancialsForm: React.FC<FinancialsFormProps> = ({
  currency,
  period,
  priceA,
  priceB,
  variableCostA,
  onChangeVariableCostA,
  variableCostB,
  onChangeVariableCostB,
  fixedCost,
  onChangeFixedCost,
  capacityUnits,
  onChangeCapacityUnits,
  lowerUnits,
  onChangeLowerUnits,
  centralUnits,
  onChangeCentralUnits,
  higherUnits,
  onChangeHigherUnits
}) => {
  const resultA = calculateFinancials({
    currency,
    period,
    price: priceA,
    variable_cost_per_sale: variableCostA,
    fixed_launch_cost: fixedCost,
    capacity_units: capacityUnits,
    sales_scenarios: {
      lower_units: lowerUnits,
      central_units: centralUnits,
      higher_units: higherUnits
    }
  });

  const resultB = calculateFinancials({
    currency,
    period,
    price: priceB,
    variable_cost_per_sale: variableCostB !== undefined ? variableCostB : variableCostA,
    fixed_launch_cost: fixedCost,
    capacity_units: capacityUnits,
    sales_scenarios: {
      lower_units: lowerUnits,
      central_units: centralUnits,
      higher_units: higherUnits
    }
  });

  return (
    <div className="workbench-card">
      <div className="card-header">
        <div>
          <h2 className="card-title">
            <span className="card-step-badge">5</span>
            <span>Deterministic Financial Scenarios (Optional)</span>
          </h2>
          <p className="card-description">
            Calculate exact break-even units and conditional net profit. Scenarios use user-entered unit volumes, not simulated panel counts.
          </p>
        </div>
      </div>

      {/* Cost Inputs */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="fixed-cost">
            <span>Fixed Launch Cost ({currency})</span>
          </label>
          <input
            id="fixed-cost"
            type="number"
            min="0"
            step="any"
            className="form-input tabular-nums"
            placeholder="e.g. 20000"
            value={fixedCost === undefined || isNaN(fixedCost) ? '' : fixedCost}
            onChange={e => onChangeFixedCost(e.target.value === '' ? undefined : parseFloat(e.target.value))}
          />
          <span className="form-help">One-time setup / tooling / batch launch expenditure for this period.</span>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="var-cost-a">
            <span>Variable Cost / Sale Option A ({currency})</span>
          </label>
          <input
            id="var-cost-a"
            type="number"
            min="0"
            step="any"
            className="form-input tabular-nums"
            placeholder="e.g. 299"
            value={variableCostA === undefined || isNaN(variableCostA) ? '' : variableCostA}
            onChange={e => onChangeVariableCostA(e.target.value === '' ? undefined : parseFloat(e.target.value))}
          />
          <span className="form-help">Unit production, packaging, materials, or delivery cost.</span>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="var-cost-b">
            <span>Variable Cost / Sale Option B ({currency})</span>
          </label>
          <input
            id="var-cost-b"
            type="number"
            min="0"
            step="any"
            className="form-input tabular-nums"
            placeholder="Same as A if empty"
            value={variableCostB === undefined || isNaN(variableCostB) ? '' : variableCostB}
            onChange={e => onChangeVariableCostB(e.target.value === '' ? undefined : parseFloat(e.target.value))}
          />
          <span className="form-help">Optional: Adjust if Option B packaging or shipping changes unit cost.</span>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="capacity-units">
            <span>Max Capacity / Available Units</span>
          </label>
          <input
            id="capacity-units"
            type="number"
            min="1"
            step="1"
            className="form-input tabular-nums"
            placeholder="e.g. 100"
            value={capacityUnits === undefined || isNaN(capacityUnits) ? '' : capacityUnits}
            onChange={e => onChangeCapacityUnits(e.target.value === '' ? undefined : Number(e.target.value))}
          />
          <span className="form-help">Maximum units you can produce or deliver in this period.</span>
        </div>
      </div>

      {/* User-Entered Sales Scenarios */}
      <div style={{ marginTop: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        <label className="form-label" style={{ marginBottom: '8px' }}>
          <span>User-Entered Sales Scenarios (Units sold in {period.replace('_', ' ')})</span>
        </label>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="scen-lower">Lower Scenario (Conservative)</label>
            <input
              id="scen-lower"
              type="number"
              min="0"
              className="form-input tabular-nums"
              placeholder="e.g. 25"
              value={lowerUnits === undefined || isNaN(lowerUnits) ? '' : lowerUnits}
              onChange={e => onChangeLowerUnits(e.target.value === '' ? undefined : Number(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="scen-central">Central Scenario (Expected)</label>
            <input
              id="scen-central"
              type="number"
              min="0"
              className="form-input tabular-nums"
              placeholder="e.g. 50"
              value={centralUnits === undefined || isNaN(centralUnits) ? '' : centralUnits}
              onChange={e => onChangeCentralUnits(e.target.value === '' ? undefined : Number(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="scen-higher">Higher Scenario (Optimistic)</label>
            <input
              id="scen-higher"
              type="number"
              min="0"
              className="form-input tabular-nums"
              placeholder="e.g. 80"
              value={higherUnits === undefined || isNaN(higherUnits) ? '' : higherUnits}
              onChange={e => onChangeHigherUnits(e.target.value === '' ? undefined : Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Real-time Calculation Result Box */}
      <div style={{ background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-3)' }}>
          <Calculator size={16} />
          <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Deterministic Financial Summary</h3>
        </div>

        {!resultA.has_sufficient_inputs ? (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' }}>
            <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--color-warning)' }} />
            <span>
              Financial scenario requires: <strong>{resultA.missing_fields.join(', ')}</strong>. You may leave this blank; the report will disclose missing cost assumptions.
            </span>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: 'var(--font-size-xs)' }}>
            {/* Option A Summary */}
            <div style={{ background: 'var(--color-surface)', padding: '12px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
              <div style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>Option A (Price: {currency} {priceA})</div>
              <div className="panel-stat-row">
                <span className="panel-stat-label">Contribution / sale:</span>
                <span className="panel-stat-val tabular-nums">{currency} {resultA.contribution_per_sale}</span>
              </div>
              <div className="panel-stat-row">
                <span className="panel-stat-label">Break-even:</span>
                <span className="panel-stat-val tabular-nums">
                  {resultA.break_even_status_message || `${resultA.break_even_units} units`}
                </span>
              </div>
              {resultA.scenarios?.central && (
                <div className="panel-stat-row" style={{ borderBottom: 'none' }}>
                  <span className="panel-stat-label">Net at {resultA.scenarios.central.units} units:</span>
                  <span className="panel-stat-val tabular-nums" style={{ color: resultA.scenarios.central.net_result >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {currency} {resultA.scenarios.central.net_result}
                  </span>
                </div>
              )}
            </div>

            {/* Option B Summary */}
            <div style={{ background: 'var(--color-surface)', padding: '12px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
              <div style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>Option B (Price: {currency} {priceB})</div>
              <div className="panel-stat-row">
                <span className="panel-stat-label">Contribution / sale:</span>
                <span className="panel-stat-val tabular-nums">{currency} {resultB.contribution_per_sale}</span>
              </div>
              <div className="panel-stat-row">
                <span className="panel-stat-label">Break-even:</span>
                <span className="panel-stat-val tabular-nums">
                  {resultB.break_even_status_message || `${resultB.break_even_units} units`}
                </span>
              </div>
              {resultB.scenarios?.central && (
                <div className="panel-stat-row" style={{ borderBottom: 'none' }}>
                  <span className="panel-stat-label">Net at {resultB.scenarios.central.units} units:</span>
                  <span className="panel-stat-val tabular-nums" style={{ color: resultB.scenarios.central.net_result >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {currency} {resultB.scenarios.central.net_result}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
