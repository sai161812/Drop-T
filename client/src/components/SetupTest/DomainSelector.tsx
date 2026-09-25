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
  const domains: { id: DomainId; label: string; desc: string; icon: React.FC<{ size?: number }> }[] = [
    {
      id: 'clothing_accessories',
      label: DOMAIN_LABELS.clothing_accessories,
      desc: 'Physical apparel, material, sizes, unit production cost & shipping',
      icon: Shirt
    },
    {
      id: 'local_food_beverages',
      label: DOMAIN_LABELS.local_food_beverages,
      desc: 'Portions, allergens, preparation, delivery zones & pickup windows',
      icon: UtensilsCrossed
    },
    {
      id: 'digital_products_services',
      label: DOMAIN_LABELS.digital_products_services,
      desc: 'Software, downloads, platform compatibility & first-period billing',
      icon: Monitor
    },
    {
      id: 'other',
      label: DOMAIN_LABELS.other,
      desc: 'Founder-described specifications without apparel, food, or software assumptions',
      icon: Package
    }
  ];

  return (
    <div className="workbench-card">
      <div className="card-header">
        <div>
          <h2 className="card-title">
            <span>Domain Category</span>
          </h2>
          <p className="card-description">Select the category of offering to tailor input fields and evaluation rules.</p>
        </div>
      </div>

      <div className="domain-grid">
        {domains.map(d => {
          const Icon = d.icon;
          const isActive = selectedDomain === d.id;
          return (
            <button
              key={d.id}
              type="button"
              className={`domain-card ${isActive ? 'active' : ''}`}
              onClick={() => onSelectDomain(d.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Icon size={16} />
                <span className="domain-card-title">{d.label}</span>
              </div>
              <p className="domain-card-desc">{d.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
