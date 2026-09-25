import React from 'react';
import './ElectricBrandMark.css';

interface ElectricBrandMarkProps {
  className?: string;
}

export const ElectricBrandMark: React.FC<ElectricBrandMarkProps> = ({ className = '' }) => (
  <span className={`electric-brand-mark ${className}`.trim()} aria-hidden="true">
    <svg viewBox="0 0 32 32" role="presentation" focusable="false">
      <path d="M18.7 2 6.8 18.2h7.5l-1.5 11.3 13-17.4h-7.4L21.1 2z" />
    </svg>
  </span>
);

export default ElectricBrandMark;
