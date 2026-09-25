import React from 'react';
import { TransitionMatrix, ResponseCategory } from '@droptest/shared';
import { ArrowRight, GitBranch } from 'lucide-react';

interface TransitionMatrixViewProps {
  matrixData: TransitionMatrix;
  nameA: string;
  nameB: string;
}

export const TransitionMatrixView: React.FC<TransitionMatrixViewProps> = ({
  matrixData,
  nameA,
  nameB
}) => {
  const categories: ResponseCategory[] = ['interested', 'unsure', 'not_interested', 'unavailable'];
  const labels: Record<ResponseCategory, string> = {
    interested: 'Interested',
    unsure: 'Unsure',
    not_interested: 'Not Interested',
    unavailable: 'Unserved'
  };

  const { matrix, top_transitions, net_interested_change, segment_switches } = matrixData;

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GitBranch size={16} style={{ color: 'var(--color-accent)' }} />
            <h4 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Paired A &rarr; B Response Transitions
            </h4>
          </div>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            Tracking how the identical 50 profiles shifted their evaluation from Option A ({nameA}) to Option B ({nameB})
          </p>
        </div>

        {/* Net Interest Change Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Net Interested Shift:</span>
          <span 
            className="badge" 
            style={{ 
              background: net_interested_change > 0 ? '#DCFCE7' : net_interested_change < 0 ? '#FEE2E2' : '#F1F5F9',
              color: net_interested_change > 0 ? '#166534' : net_interested_change < 0 ? '#991B1B' : '#475569',
              fontWeight: 700,
              fontSize: '12px'
            }}
          >
            {net_interested_change > 0 ? `+${net_interested_change} Personas` : `${net_interested_change} Personas`}
          </span>
        </div>
      </div>

      {/* Grid: 4x4 Matrix Table & Segment Switches */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
        {/* 4x4 Matrix Table */}
        <div style={{ border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)', overflowX: 'auto' }}>
          <div style={{ padding: '8px 12px', background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border-subtle)', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            Transition Grid (Rows: Option A &rarr; Columns: Option B)
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'center' }}>
            <thead>
              <tr style={{ background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Option A \ B</th>
                {categories.map(c => (
                  <th key={c} style={{ padding: '6px 8px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    {labels[c]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map(fromCat => (
                <tr key={fromCat} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <td style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-primary)', background: 'var(--color-surface-subtle)' }}>
                    {labels[fromCat]}
                  </td>
                  {categories.map(toCat => {
                    const count = matrix[fromCat]?.[toCat] || 0;
                    const isDiagonal = fromCat === toCat;
                    const isFavorable = fromCat !== 'interested' && toCat === 'interested';
                    const isUnfavorable = fromCat === 'interested' && toCat !== 'interested';

                    let cellBg = 'transparent';
                    let cellColor = 'var(--color-text-primary)';
                    let fontWeight = 400;

                    if (count > 0) {
                      fontWeight = 600;
                      if (isFavorable) {
                        cellBg = '#DCFCE7';
                        cellColor = '#166534';
                      } else if (isUnfavorable) {
                        cellBg = '#FEE2E2';
                        cellColor = '#991B1B';
                      } else if (isDiagonal) {
                        cellBg = '#F8FAFC';
                        cellColor = '#475569';
                      }
                    }

                    return (
                      <td 
                        key={toCat} 
                        style={{ 
                          padding: '8px 10px', 
                          background: cellBg, 
                          color: cellColor, 
                          fontWeight 
                        }}
                        className="tabular-nums"
                      >
                        {count}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Segment Switches Summary */}
        <div style={{ border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)', padding: '12px', background: 'var(--color-surface-subtle)' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
            Interest Movement by Segment
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Intended */}
            <div style={{ background: 'var(--color-surface)', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="badge badge-intended" style={{ fontSize: '10px' }}>Intended (20)</span>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  +{segment_switches.intended.gained_interested} gained, -{segment_switches.intended.lost_interested} lost
                </div>
              </div>
              <span className="tabular-nums" style={{ fontSize: '14px', fontWeight: 700, color: segment_switches.intended.net > 0 ? '#166534' : segment_switches.intended.net < 0 ? '#991B1B' : 'var(--color-text-muted)' }}>
                {segment_switches.intended.net > 0 ? `+${segment_switches.intended.net}` : segment_switches.intended.net}
              </span>
            </div>

            {/* Adjacent */}
            <div style={{ background: 'var(--color-surface)', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="badge badge-adjacent" style={{ fontSize: '10px' }}>Adjacent (20)</span>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  +{segment_switches.adjacent.gained_interested} gained, -{segment_switches.adjacent.lost_interested} lost
                </div>
              </div>
              <span className="tabular-nums" style={{ fontSize: '14px', fontWeight: 700, color: segment_switches.adjacent.net > 0 ? '#166534' : segment_switches.adjacent.net < 0 ? '#991B1B' : 'var(--color-text-muted)' }}>
                {segment_switches.adjacent.net > 0 ? `+${segment_switches.adjacent.net}` : segment_switches.adjacent.net}
              </span>
            </div>

            {/* Contrasting */}
            <div style={{ background: 'var(--color-surface)', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="badge badge-contrasting" style={{ fontSize: '10px' }}>Contrasting (10)</span>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  +{segment_switches.contrasting.gained_interested} gained, -{segment_switches.contrasting.lost_interested} lost
                </div>
              </div>
              <span className="tabular-nums" style={{ fontSize: '14px', fontWeight: 700, color: segment_switches.contrasting.net > 0 ? '#166534' : segment_switches.contrasting.net < 0 ? '#991B1B' : 'var(--color-text-muted)' }}>
                {segment_switches.contrasting.net > 0 ? `+${segment_switches.contrasting.net}` : segment_switches.contrasting.net}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Shift Highlights */}
      {top_transitions.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
          <span style={{ fontWeight: 600 }}>Top Persona Shifts:</span>
          {top_transitions.slice(0, 4).map((tr, idx) => (
            <span 
              key={idx}
              className="badge"
              style={{
                background: tr.to === 'interested' ? '#DCFCE7' : '#F1F5F9',
                color: tr.to === 'interested' ? '#166534' : '#475569',
                border: '1px solid var(--color-border-subtle)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>{labels[tr.from]}</span>
              <ArrowRight size={10} />
              <span>{labels[tr.to]}</span>
              <strong className="tabular-nums">({tr.count})</strong>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
