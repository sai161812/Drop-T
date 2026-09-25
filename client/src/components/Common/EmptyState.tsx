import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message: string;
  actionTitle?: string;
  actionSteps?: string[];
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  message,
  actionTitle,
  actionSteps,
  primaryActionLabel,
  onPrimaryAction
}) => {
  return (
    <div className="empty-state-container">
      <div className="empty-state-icon">
        <Icon size={24} />
      </div>
      <h2 className="empty-state-title">{title}</h2>
      <p className="empty-state-message">{message}</p>

      {actionSteps && actionSteps.length > 0 && (
        <div className="empty-state-action-box">
          {actionTitle && <div className="empty-state-action-title">{actionTitle}</div>}
          <ol style={{ paddingLeft: '18px', margin: '4px 0 0 0', lineHeight: '1.6' }}>
            {actionSteps.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {primaryActionLabel && onPrimaryAction && (
        <button 
          type="button" 
          className="btn btn-primary"
          onClick={onPrimaryAction}
        >
          {primaryActionLabel}
        </button>
      )}
    </div>
  );
};
