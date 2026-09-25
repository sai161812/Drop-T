import React, { useState } from 'react';
import { 
  OptionResultSummary, 
  EligibilityChangeSummary, 
  AudienceSegment 
} from '@droptest/shared';
import { Users, MapPin, AlertCircle } from 'lucide-react';

interface BreakdownTableProps {
  summaryA: OptionResultSummary;
  summaryB?: OptionResultSummary;
  eligibilityChanges?: EligibilityChangeSummary[];
}

export const BreakdownTable: React.FC<BreakdownTableProps> = ({
  summaryA,
  summaryB,
  eligibilityChanges = []
}) => {
  const [activeTab, setActiveTab] = useState<'segments' | 'markets'>('segments');

  const segments: { key: AudienceSegment; label: string; count: number }[] = [
    { key: 'intended', label: 'Intended Buyers', count: 20 },
    { key: 'adjacent', label: 'Adjacent Buyers', count: 20 },
    { key: 'contrasting', label: 'Contrasting Positioning', count: 10 }
  ];

  const markets = Object.keys(summaryA.by_market);
  const isComparison = Boolean(summaryB);

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
      {/* Top Denominators Banner */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <h4 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
          Simulated Interest & Coverage Breakdown (50 AI Personas)
        </h4>
        {(summaryA.missing_total > 0 || (summaryB?.missing_total || 0) > 0) && (
          <p role="status" style={{ fontSize: 11, color: '#92400E', marginBottom: 8 }}>
            Missing evaluations are shown separately from unserved personas. Coverage counts use the saved market settings; incomplete responses are excluded from the interest totals.
          </p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: isComparison ? 'repeat(auto-fit, minmax(240px, 1fr))' : '1fr', gap: 'var(--space-3)' }}>
          {/* Option A Rates */}
          <div 
            style={{ 
              background: 'var(--color-surface-subtle)', 
              border: '1px solid var(--color-border-subtle)', 
              borderRadius: 'var(--radius-md)', 
              padding: '12px' 
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>
              {isComparison ? `Option A (${summaryA.option_name})` : summaryA.option_name}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '6px' }}>
              <div>
                <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)' }} className="tabular-nums">
                  {summaryA.interested_total}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}> / 50 total profiles</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#166534' }} className="tabular-nums">
                  {summaryA.interested_total} / {summaryA.eligible_count}
                </span>
                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>eligible profiles</div>
              </div>
            </div>
            {summaryA.unserved_count > 0 && (
              <div style={{ fontSize: '10px', color: '#991B1B', marginTop: '6px' }}>
                {summaryA.unserved_count} profiles outside configured coverage; {summaryA.missing_total} evaluations missing
              </div>
            )}
          </div>

          {/* Option B Rates (If Comparison Mode) */}
          {summaryB && (
            <div 
              style={{ 
                background: 'var(--color-surface-subtle)', 
                border: '1px solid var(--color-border-subtle)', 
                borderRadius: 'var(--radius-md)', 
                padding: '12px' 
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-accent)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Option B ({summaryB.option_name})
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '6px' }}>
                <div>
                  <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-accent)' }} className="tabular-nums">
                    {summaryB.interested_total}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}> / 50 total profiles</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#166534' }} className="tabular-nums">
                    {summaryB.interested_total} / {summaryB.eligible_count}
                  </span>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>eligible profiles</div>
                </div>
              </div>
              {summaryB.unserved_count > 0 && (
                <div style={{ fontSize: '10px', color: '#991B1B', marginTop: '6px' }}>
                  {summaryB.unserved_count} profiles outside configured coverage; {summaryB.missing_total} evaluations missing
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs Switcher: By Segment vs By Market */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-3)', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '8px' }}>
        <button
          type="button"
          className="btn"
          style={{
            fontSize: '12px',
            padding: '4px 12px',
            background: activeTab === 'segments' ? 'var(--color-accent)' : 'transparent',
            color: activeTab === 'segments' ? '#FFFFFF' : 'var(--color-text-secondary)',
            fontWeight: 600,
            border: activeTab === 'segments' ? 'none' : '1px solid var(--color-border)'
          }}
          onClick={() => setActiveTab('segments')}
        >
          <Users size={12} style={{ display: 'inline', marginRight: '4px' }} />
          By Audience Segment (20 / 20 / 10)
        </button>

        <button
          type="button"
          className="btn"
          style={{
            fontSize: '12px',
            padding: '4px 12px',
            background: activeTab === 'markets' ? 'var(--color-accent)' : 'transparent',
            color: activeTab === 'markets' ? '#FFFFFF' : 'var(--color-text-secondary)',
            fontWeight: 600,
            border: activeTab === 'markets' ? 'none' : '1px solid var(--color-border)'
          }}
          onClick={() => setActiveTab('markets')}
        >
          <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
          By Audience Market ({markets.length} Markets)
        </button>
      </div>

      {/* Segment Breakdown Table */}
      {activeTab === 'segments' && (
        <div style={{ overflowX: 'auto', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Segment</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Total ($n$)</th>
                <th style={{ padding: '8px 12px', fontWeight: 600, color: '#166534' }}>{isComparison ? 'Option A (Int / Unsure / Not / Unserved / Missing)' : 'Responses (Int / Unsure / Not / Unserved / Missing)'}</th>
                {summaryB && <th style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--color-accent)' }}>Option B (Int / Unsure / Not / Unserved / Missing)</th>}
                {summaryB && <th style={{ padding: '8px 12px', fontWeight: 600, textAlign: 'right' }}>Net Int. Change</th>}
              </tr>
            </thead>
            <tbody>
              {segments.map(seg => {
                const a = summaryA.by_segment[seg.key];
                const b = summaryB?.by_segment[seg.key];
                const net = b ? b.interested - a.interested : 0;

                return (
                  <tr key={seg.key} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>
                      <span className={`badge badge-${seg.key}`} style={{ textTransform: 'capitalize' }}>
                        {seg.label}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--color-text-muted)' }} className="tabular-nums">
                      {seg.count}
                    </td>
                    <td style={{ padding: '8px 12px' }} className="tabular-nums">
                      <span style={{ color: '#166534', fontWeight: 600 }}>{a.interested}</span> / 
                      <span style={{ color: '#92400E' }}> {a.unsure}</span> / 
                      <span style={{ color: '#991B1B' }}> {a.not_interested}</span> / 
                      <span style={{ color: 'var(--color-text-muted)' }}> {a.unavailable}</span> /
                      <span style={{ color: '#92400E' }}> {a.missing}</span>
                    </td>
                    {b && (
                      <td style={{ padding: '8px 12px' }} className="tabular-nums">
                        <span style={{ color: '#166534', fontWeight: 600 }}>{b.interested}</span> / 
                        <span style={{ color: '#92400E' }}> {b.unsure}</span> / 
                        <span style={{ color: '#991B1B' }}> {b.not_interested}</span> / 
                        <span style={{ color: 'var(--color-text-muted)' }}> {b.unavailable}</span> /
                        <span style={{ color: '#92400E' }}> {b.missing}</span>
                      </td>
                    )}
                    {b && (
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }} className="tabular-nums">
                        <span style={{ color: net > 0 ? '#166534' : net < 0 ? '#991B1B' : 'var(--color-text-muted)' }}>
                          {net > 0 ? `+${net}` : net}
                        </span>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Market Breakdown Table */}
      {activeTab === 'markets' && (
        <div style={{ overflowX: 'auto', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Audience Market</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Personas ($n$)</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>{isComparison ? 'Option A Coverage & Responses' : 'Coverage & Responses'}</th>
                {summaryB && <th style={{ padding: '8px 12px', fontWeight: 600 }}>Option B Coverage & Responses</th>}
              </tr>
            </thead>
            <tbody>
              {markets.map(mkt => {
                const a = summaryA.by_market[mkt] || { total: 0, interested: 0, unsure: 0, not_interested: 0, unavailable: 0, missing: 0, access_status: 'unserved' as const };
                const b = summaryB?.by_market[mkt] || { total: 0, interested: 0, unsure: 0, not_interested: 0, unavailable: 0, missing: 0, access_status: 'unserved' as const };

                return (
                  <tr key={mkt} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{mkt}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--color-text-muted)' }} className="tabular-nums">
                      {a.total}
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="badge" style={{ background: a.access_status === 'served' ? '#DCFCE7' : '#FEE2E2', color: a.access_status === 'served' ? '#166534' : '#991B1B', fontSize: '10px' }}>
                          {a.access_status.toUpperCase()}
                        </span>
                        <span className="tabular-nums">
                          {a.access_status === 'served' ? `${a.interested} int / ${a.unsure} unsure / ${a.not_interested} not / ${a.missing} missing` : `${a.total} unserved / ${a.missing} missing`}
                        </span>
                      </div>
                    </td>
                    {summaryB && (
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="badge" style={{ background: b.access_status === 'served' ? '#DCFCE7' : '#FEE2E2', color: b.access_status === 'served' ? '#166534' : '#991B1B', fontSize: '10px' }}>
                            {b.access_status.toUpperCase()}
                          </span>
                          <span className="tabular-nums">
                          {b.access_status === 'served' ? `${b.interested} int / ${b.unsure} unsure / ${b.not_interested} not / ${b.missing} missing` : `${b.total} unserved / ${b.missing} missing`}
                          </span>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Eligibility Changes Callout (if any markets changed access in comparison mode) */}
      {summaryB && eligibilityChanges.some(c => c.change_type !== 'unchanged') && (
        <div style={{ marginTop: 'var(--space-4)', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 'var(--radius-md)', padding: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: '#0F172A', textTransform: 'uppercase', marginBottom: '6px' }}>
            <AlertCircle size={14} style={{ color: 'var(--color-accent)' }} />
            Location & Market Eligibility Transitions
          </div>
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#334155' }}>
            {eligibilityChanges.map((c, i) => (
              <li key={i} style={{ marginBottom: '4px' }}>
                <strong>{c.market}: </strong>
                <span>{c.coverage_note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
