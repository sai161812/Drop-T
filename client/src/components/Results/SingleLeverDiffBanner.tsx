import React from 'react';
import { SingleLeverDiffData } from '@droptest/shared';
import { GitCompare, DollarSign } from 'lucide-react';

interface SingleLeverDiffBannerProps {
  diffData: SingleLeverDiffData;
  nameA: string;
  nameB: string;
}

export const SingleLeverDiffBanner: React.FC<SingleLeverDiffBannerProps> = ({
  diffData,
  nameA,
  nameB
}) => {
  const { lever, field_diffs, cost_diff } = diffData;

  const leverLabels: Record<string, string> = {
    price: 'Price Lever',
    message: 'Primary Message Lever',
    served_markets: 'Served Markets (Location) Lever',
    creative: 'Creative & Visual Positioning Lever'
  };

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GitCompare size={16} style={{ color: 'var(--color-accent)' }} />
          <h4 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Single Comparison Lever: {leverLabels[lever] || lever}
          </h4>
        </div>
        <span className="badge badge-intended" style={{ textTransform: 'uppercase', fontSize: '10px' }}>
          Exact A &rarr; B Diff
        </span>
      </div>

      {/* Field Diffs Table */}
      <div style={{ overflowX: 'auto', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border-subtle)' }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', width: '25%', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Tested Field</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', width: '37.5%', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Option A ({nameA})</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', width: '37.5%', fontWeight: 600, color: 'var(--color-accent)' }}>Option B ({nameB})</th>
            </tr>
          </thead>
          <tbody>
            {field_diffs.map((diff, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--color-border-subtle)', background: 'var(--color-surface)' }}>
                <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {diff.label}
                </td>
                <td style={{ padding: '8px 12px', color: 'var(--color-text-secondary)' }}>
                  {Array.isArray(diff.val_a) ? diff.val_a.join(', ') : String(diff.val_a)}
                </td>
                <td style={{ padding: '8px 12px', color: 'var(--color-text-primary)', fontWeight: 600 }}>
                  {Array.isArray(diff.val_b) ? diff.val_b.join(', ') : String(diff.val_b)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Linked Cost Change Disclosure */}
      {cost_diff?.has_cost_variance && (
        <div 
          style={{ 
            marginTop: 'var(--space-3)', 
            background: '#F8FAFC', 
            border: '1px solid #E2E8F0', 
            borderRadius: 'var(--radius-md)', 
            padding: '10px 12px',
            fontSize: '11px',
            color: '#334155',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <DollarSign size={14} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
          <div>
            <strong>Linked Production/Fulfillment Cost Variance: </strong>
            <span>
              Option A variable cost is ${cost_diff.var_cost_a ?? 0}/unit vs Option B is ${cost_diff.var_cost_b ?? 0}/unit. This variance is factored into the net financial break-even calculation.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
