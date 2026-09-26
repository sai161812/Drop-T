import React from 'react';
import { Shirt, UtensilsCrossed, Monitor, Package } from 'lucide-react';
import { DomainId, DOMAIN_LABELS } from '@droptest/shared';

interface DomainSelectorProps {
  selectedDomain: DomainId;
  onSelectDomain: (domain: DomainId) => void;
}

export const DomainSelector: React.FC<DomainSelectorProps> = ({
  selectedDomain,
  onSelectDomain
}) => {
  const domains: { id: DomainId; label: string; tag: string; icon: React.FC<{ size?: number }> }[] = [
    {
      id: 'clothing_accessories',
      label: 'Apparel & Goods',
      tag: 'Sizes, materials, shipping',
      icon: Shirt
    },
    {
      id: 'local_food_beverages',
      label: 'Food & Beverage',
      tag: 'Batches, fresh pickup/delivery',
      icon: UtensilsCrossed
    },
    {
      id: 'digital_products_services',
      label: 'Digital / Software',
      tag: 'Cloud, subscription, access',
      icon: Monitor
    },
    {
      id: 'other',
      label: 'Hardware & Other',
      tag: 'Consumer IoT, specs, custom',
      icon: Package
    }
  ];

  return (
    <div className="workbench-card" style={{ padding: '16px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Category Framework
          </span>
          <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: '2px 0 0 0' }}>
            Tailors specification fields and buyer evaluation heuristics.
          </p>
        </div>
        <span 
          style={{ 
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: '10px', 
            fontWeight: 700, 
            padding: '2px 8px', 
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-surface-subtle)',
            border: '1px solid var(--color-border-subtle)',
            color: 'var(--color-text-secondary)',
            textTransform: 'uppercase'
          }}
        >
          {DOMAIN_LABELS[selectedDomain] || selectedDomain}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
        {domains.map(d => {
          const Icon = d.icon;
          const isActive = selectedDomain === d.id;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => onSelectDomain(d.id)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                background: isActive ? 'var(--color-surface)' : 'var(--color-surface-subtle)',
                border: isActive ? '1.5px solid var(--color-text-primary)' : '1px solid var(--color-border)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              <div 
                style={{ 
                  marginTop: '1px',
                  color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-muted)'
                }}
              >
                <Icon size={16} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div 
                  style={{ 
                    fontSize: '12px', 
                    fontWeight: isActive ? 700 : 600, 
                    color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    lineHeight: 1.2
                  }}
                >
                  {d.label}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px', lineHeight: 1.2 }}>
                  {d.tag}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
