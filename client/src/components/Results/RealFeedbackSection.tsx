import React from 'react';
import { MessageSquare, Users2, Link2 } from 'lucide-react';

interface RealFeedbackSectionProps {
  testId?: string;
}

export const RealFeedbackSection: React.FC<RealFeedbackSectionProps> = ({ testId: _testId }) => {
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users2 size={16} style={{ color: 'var(--color-text-secondary)' }} />
          <h4 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Responses from Real People (Validation Layer)
          </h4>
        </div>
        <span className="badge badge-contrasting" style={{ fontSize: '10px' }}>
          Real Feedback Phase
        </span>
      </div>

      <div 
        style={{ 
          background: 'var(--color-surface-subtle)', 
          border: '1px dashed var(--color-border)', 
          borderRadius: 'var(--radius-md)', 
          padding: '24px 20px', 
          textAlign: 'center' 
        }}
      >
        <MessageSquare size={28} style={{ color: 'var(--color-text-muted)', margin: '0 auto 8px auto' }} />
        <h5 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
          No Real-Person Feedback Collected Yet
        </h5>
        <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', maxWidth: '520px', margin: '0 auto 12px auto', lineHeight: 1.45 }}>
          Simulated profiles generate questions worth checking. Real human feedback from your shareable test link will appear in this dedicated section, keeping simulated observations and real responses strictly separated with their own distinct denominators.
        </p>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-text-muted)', background: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)', padding: '6px 12px', borderRadius: 'var(--radius-sm)' }}>
          <Link2 size={12} />
          <span>Public Feedback Page URL will be unlocked in Phase 6</span>
        </div>
      </div>
    </div>
  );
};
