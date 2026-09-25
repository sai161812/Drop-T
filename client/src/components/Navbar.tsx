import React from 'react';
import { Layers, PlayCircle, BarChart3, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';

export type PageTab = 'setup' | 'results' | 'feedback';

interface NavbarProps {
  activeTab: PageTab;
  onTabChange: (tab: PageTab) => void;
  testTitle?: string;
  isSaving?: boolean;
  saveStatus?: 'saved' | 'saving' | 'error' | 'idle';
  onSave?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  testTitle,
  isSaving,
  saveStatus,
  onSave
}) => {
  return (
    <header className="navbar">
      <div className="navbar-brand">
        <span className="brand-badge">DROPTEST</span>
        <h1 className="brand-title">
          <Layers size={18} />
          <span>Launch Decision Workbench</span>
        </h1>
        {testTitle && (
          <span className="brand-subtitle" title={testTitle}>
            {testTitle.length > 25 ? `${testTitle.substring(0, 25)}...` : testTitle}
          </span>
        )}
      </div>

      <nav className="nav-tabs" aria-label="Workbench navigation">
        <button
          type="button"
          className={`nav-tab-btn ${activeTab === 'setup' ? 'active' : ''}`}
          onClick={() => onTabChange('setup')}
        >
          <PlayCircle size={15} />
          <span>Set up test</span>
        </button>

        <button
          type="button"
          className={`nav-tab-btn ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => onTabChange('results')}
        >
          <BarChart3 size={15} />
          <span>Results</span>
        </button>

        <button
          type="button"
          className={`nav-tab-btn ${activeTab === 'feedback' ? 'active' : ''}`}
          onClick={() => onTabChange('feedback')}
        >
          <MessageSquare size={15} />
          <span>Public feedback</span>
        </button>
      </nav>

      <div className="nav-actions">
        {saveStatus === 'saved' && (
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle size={14} /> Draft saved
          </span>
        )}
        {saveStatus === 'saving' && (
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            Saving...
          </span>
        )}
        {saveStatus === 'error' && (
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertCircle size={14} /> Save failed
          </span>
        )}
        {onSave && (
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onSave}
            disabled={isSaving}
          >
            Save draft
          </button>
        )}
      </div>
    </header>
  );
};
