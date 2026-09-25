import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import { 
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
  onOpenAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenAuthModal
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
      <div 
        className="navbar-brand" 
        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
        onClick={() => onTabChange('explore')}
      >
        <span className="brand-badge" style={{ background: 'var(--color-primary)', color: '#FFF', padding: '3px 7px', borderRadius: 'var(--radius-sm)', fontSize: '11px', fontWeight: 800 }}>
          DROPTEST
        </span>
        <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text-primary)' }}>
          Launch Workbench
        </span>
      </div>

      {/* Main Nav Tabs */}
      <nav className="nav-tabs" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button
          type="button"
          className={`nav-tab-btn ${activeTab === 'explore' || activeTab === 'product-detail' ? 'active' : ''}`}
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
              onClick={() => onTabChange('publish')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
            >
              <PlusCircle size={15} />
              <span>Publish Product</span>
            </button>

            <button
              type="button"
              className={`nav-tab-btn ${activeTab === 'my-products' ? 'active' : ''}`}
              onClick={() => onTabChange('my-products')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
            >
              <Package size={15} />
              <span>My Products</span>
            </button>
          </>
        )}

        <button
          type="button"
          className={`nav-tab-btn ${activeTab === 'setup' || activeTab === 'results' ? 'active' : ''}`}
          onClick={() => onTabChange('setup')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          title="Synthetic Simulation Lab"
        >
          <FlaskConical size={15} />
          <span>Synthetic Lab</span>
        </button>
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
              onClick={() => signOut()}
              title="Sign Out"
            >
              <LogOut size={12} /> Sign Out
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 14px' }}
            onClick={onOpenAuthModal}
          >
            <LogIn size={14} /> Sign In / Sign Up
          </button>
        )}
      </div>
    </header>
  );
};
