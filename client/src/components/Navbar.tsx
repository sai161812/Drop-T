import React from 'react';
import type { UserRole } from '@droptest/shared';
import { useAuth } from '../context/AuthContext.js';
import { ElectricBrandMark } from './Common/ElectricBrandMark.js';
import { 
  Home,
  Compass, 
  Bookmark,
  PlusCircle, 
  Package, 
  FlaskConical, 
  LogIn, 
  LogOut, 
  User as UserIcon,
  Briefcase,
  Rocket
} from 'lucide-react';

export type PageTab = 'explore' | 'saved' | 'product-detail' | 'publish' | 'my-products' | 'setup' | 'results' | 'feedback';

interface NavbarProps {
  activeTab: PageTab;
  onTabChange: (tab: PageTab) => void;
  onOpenAuthModal: (role?: UserRole) => void;
  onGoHome?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenAuthModal,
  onGoHome
}) => {
  const { user, signOut } = useAuth();

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'startup':
        return { label: 'Startup Founder', icon: <Rocket size={12} />, bg: '#DCFCE7', text: '#15803D' };
      case 'sponsor':
        return { label: 'Sponsor Backer', icon: <Briefcase size={12} />, bg: '#FEF3C7', text: '#B45309' };
      default:
        return { label: 'Community Shopper', icon: <UserIcon size={12} />, bg: '#E0E7FF', text: '#4338CA' };
    }
  };

  return (
    <header className="navbar" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 var(--space-6)',
      height: '60px',
      background: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Brand */}
      <button
        type="button"
        className="navbar-brand" 
        aria-label="DROPTEST home"
        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: 0, padding: 0, background: 'transparent', color: 'inherit' }}
        onClick={onGoHome || (() => onTabChange('explore'))}
      >
        <ElectricBrandMark />
        <span style={{ fontWeight: 800, fontSize: '15px', letterSpacing: '-0.03em', color: 'var(--color-text-primary)' }}>
          DROPTEST
        </span>
        <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text-primary)' }}>
          Launch Workbench
        </span>
      </button>

      {/* Main Nav Tabs */}
      <nav className="nav-tabs" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {onGoHome && (
          <button
            type="button"
            className="nav-tab-btn"
            onClick={onGoHome}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
            title="Return to Landing Page"
          >
            <Home size={15} />
            <span>Home</span>
          </button>
        )}

        <button
          type="button"
          className={`nav-tab-btn ${activeTab === 'explore' || activeTab === 'product-detail' ? 'active' : ''}`}
          aria-current={activeTab === 'explore' || activeTab === 'product-detail' ? 'page' : undefined}
          onClick={() => onTabChange('explore')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
        >
          <Compass size={15} />
          <span>Explore Products</span>
        </button>

        {user && (
          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
            aria-current={activeTab === 'saved' ? 'page' : undefined}
            onClick={() => onTabChange('saved')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <Bookmark size={15} />
            <span>Saved</span>
          </button>
        )}

        {user?.role === 'startup' && (
          <>
            <button
              type="button"
              className={`nav-tab-btn ${activeTab === 'publish' ? 'active' : ''}`}
              aria-current={activeTab === 'publish' ? 'page' : undefined}
              onClick={() => onTabChange('publish')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
            >
              <PlusCircle size={15} />
              <span>Publish Product</span>
            </button>

            <button
              type="button"
              className={`nav-tab-btn ${activeTab === 'my-products' ? 'active' : ''}`}
              aria-current={activeTab === 'my-products' ? 'page' : undefined}
              onClick={() => onTabChange('my-products')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
            >
              <Package size={15} />
              <span>My Products</span>
            </button>
          </>
        )}

        {user?.role !== 'user' && (
          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'setup' || activeTab === 'results' ? 'active' : ''}`}
            aria-current={activeTab === 'setup' || activeTab === 'results' ? 'page' : undefined}
            onClick={() => onTabChange('setup')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
            title="Synthetic Simulation Lab"
          >
            <FlaskConical size={15} />
            <span>Synthetic Lab</span>
          </button>
        )}
      </nav>

      {/* User Auth Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Role Badge */}
            {(() => {
              const badge = getRoleBadge(user.role);
              return (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: badge.bg,
                  color: badge.text,
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '11px',
                  fontWeight: 600
                }}>
                  {badge.icon}
                  <span>{badge.label}</span>
                </div>
              );
            })()}

            {/* Display Name */}
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {user.display_name}
            </span>

            {/* Sign Out Button */}
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={async () => {
                await signOut();
                if (onGoHome) onGoHome();
              }}
              title="Sign Out"
            >
              <LogOut size={12} /> Sign Out
            </button>
          </div>
        ) : (
          <div className="signup-dropdown-wrapper">
            <button
              type="button"
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 14px' }}
              onClick={() => onOpenAuthModal()}
              aria-haspopup="menu"
            >
              <LogIn size={14} /> Sign In / Sign Up
            </button>
            <div className="signup-dropdown-menu" role="menu">
              <button
                type="button"
                className="signup-dropdown-item"
                role="menuitem"
                onClick={() => onOpenAuthModal('user')}
              >
                <span className="dropdown-item-num">1.</span>
                <span>User Login</span>
              </button>
              <button
                type="button"
                className="signup-dropdown-item"
                role="menuitem"
                onClick={() => onOpenAuthModal('startup')}
              >
                <span className="dropdown-item-num">2.</span>
                <span>Startup Login</span>
              </button>
              <button
                type="button"
                className="signup-dropdown-item"
                role="menuitem"
                onClick={() => onOpenAuthModal('sponsor')}
              >
                <span className="dropdown-item-num">3.</span>
                <span>Investor Login</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
