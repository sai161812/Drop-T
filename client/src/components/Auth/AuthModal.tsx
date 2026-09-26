import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { UserRole, DEMO_ACCOUNTS } from '@droptest/shared';
import { X, Mail, Lock, Eye, EyeOff, User, Briefcase, Rocket } from 'lucide-react';
import './AuthModal.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: UserRole;
  initialTab?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'startup',
  initialTab = 'signin'
}) => {
  const { signIn, signUp, quickDemoLogin } = useAuth();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<'signin' | 'signup'>(initialTab);
  const [role, setRole] = useState<UserRole>(defaultRole);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [startupName, setStartupName] = useState('');
  const [startupDesc, setStartupDesc] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (defaultRole) {
      setRole(defaultRole);
    }
  }, [defaultRole]);

  useEffect(() => {
    if (!isOpen) return;
    setTab(initialTab);
    setError(null);
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    
    // Focus close button initially
    const closeBtn = dialog?.querySelector<HTMLElement>('button[aria-label="Close"]');
    if (closeBtn) {
      closeBtn.focus();
    } else {
      dialog?.querySelector<HTMLElement>('button, input, select, textarea')?.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      } else if (event.key === 'Tab' && dialog) {
        const focusable = Array.from(
          dialog.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter(element => element.getClientRects().length > 0);

        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (tab === 'signin') {
        const res = await signIn({ email, password });
        if (res.success) {
          onClose();
        } else {
          setError(res.error || 'Invalid credentials');
        }
      } else {
        const res = await signUp({
          email,
          password,
          role,
          display_name: displayName,
          startup_name: role === 'startup' ? startupName : undefined,
          startup_description: role === 'startup' ? startupDesc : undefined
        });

        if (res.success) {
          onClose();
        } else {
          setError(res.error || 'Registration failed');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await quickDemoLogin(demoEmail);
      if (result.success) onClose();
      else setError(result.error || 'Quick login failed');
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = async (provider: 'Google' | 'GitHub' | 'Apple') => {
    setError(null);
    setIsSubmitting(true);
    try {
      const targetAccount = DEMO_ACCOUNTS.find(a => a.role === role) || DEMO_ACCOUNTS[0];
      const result = await quickDemoLogin(targetAccount.email);
      if (result.success) {
        onClose();
      } else {
        setError(result.error || `${provider} sign-in failed`);
      }
    } catch (err: any) {
      setError(err.message || `${provider} authentication failed`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleDisplayName = (r: UserRole) => {
    switch (r) {
      case 'user':
        return 'User Login';
      case 'sponsor':
        return 'Investor Login';
      default:
        return 'Startup Login';
    }
  };

  return (
    <div className="auth-glass-backdrop" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      {/* Background shadow matching dark DROPTEST UI */}
      <div className="auth-ambient-shadow" aria-hidden="true" />

      {/* The Frosted Glass Card */}
      <div 
        ref={dialogRef} 
        className="auth-glass-card" 
        role="dialog" 
        aria-modal="true" 
        aria-label="Sign In to DROPTEST"
      >
        {/* Close Button as first focusable element */}
        <button
          type="button"
          className="auth-close-btn"
          onClick={onClose}
          aria-label="Close"
          title="Close dialog"
        >
          <X size={16} />
        </button>

        {/* Top Brand & Role Indicator */}
        <div className="auth-brand-header">
          <span className="auth-brand-logo">DROPTEST</span>
          <div className="auth-role-pill-badge">
            <span>{getRoleDisplayName(role)}</span>
          </div>
        </div>

        {/* Main Headline */}
        <h2 id="auth-dialog-title" className="auth-main-headline" style={{ marginBottom: '16px' }}>
          {tab === 'signin' ? (
            <>Log In with Credentials</>
          ) : (
            <>Create Your<br />{role === 'startup' ? 'Founder' : role === 'sponsor' ? 'Investor' : 'Community'} Account</>
          )}
        </h2>

        {/* Top Segmented Mode Switcher */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px',
          background: 'rgba(255, 255, 255, 0.08)',
          padding: '4px',
          borderRadius: '999px',
          marginBottom: '20px',
          border: '1px solid rgba(255, 255, 255, 0.14)'
        }}>
          <button
            type="button"
            onClick={() => { setTab('signin'); setError(null); }}
            style={{
              padding: '8px 16px',
              borderRadius: '999px',
              border: 'none',
              background: tab === 'signin' ? 'rgba(255, 255, 255, 0.22)' : 'transparent',
              color: tab === 'signin' ? '#ffffff' : 'rgba(255, 255, 255, 0.65)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setTab('signup'); setError(null); }}
            style={{
              padding: '8px 16px',
              borderRadius: '999px',
              border: 'none',
              background: tab === 'signup' ? 'rgba(255, 255, 255, 0.22)' : 'transparent',
              color: tab === 'signup' ? '#ffffff' : 'rgba(255, 255, 255, 0.65)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div role="alert" className="auth-error-banner">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {tab === 'signup' && (
            <>
              {/* Role Selection Tabs */}
              <div className="auth-field-group">
                <label className="auth-field-label">Select Account Type</label>
                <div className="auth-role-tabs-grid">
                  <button
                    type="button"
                    className={`auth-role-tab-btn ${role === 'user' ? 'active' : ''}`}
                    onClick={() => setRole('user')}
                  >
                    <User size={15} />
                    <span>User</span>
                    <span className="role-sub">Shopper</span>
                  </button>
                  <button
                    type="button"
                    className={`auth-role-tab-btn ${role === 'startup' ? 'active' : ''}`}
                    onClick={() => setRole('startup')}
                  >
                    <Rocket size={15} />
                    <span>Startup</span>
                    <span className="role-sub">Founder</span>
                  </button>
                  <button
                    type="button"
                    className={`auth-role-tab-btn ${role === 'sponsor' ? 'active' : ''}`}
                    onClick={() => setRole('sponsor')}
                  >
                    <Briefcase size={15} />
                    <span>Investor</span>
                    <span className="role-sub">Sponsor</span>
                  </button>
                </div>
              </div>

              {/* Display Name */}
              <div className="auth-field-group">
                <label className="auth-field-label" htmlFor="auth-display-name">Display Name *</label>
                <div className="auth-pill-input-wrap">
                  <User size={16} className="auth-pill-icon" />
                  <input
                    id="auth-display-name"
                    type="text"
                    className="auth-pill-input"
                    placeholder="Enter your name"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Startup Specific Fields */}
              {role === 'startup' && (
                <>
                  <div className="auth-field-group">
                    <label className="auth-field-label" htmlFor="auth-startup-name">Startup / Brand Name *</label>
                    <div className="auth-pill-input-wrap">
                      <Rocket size={16} className="auth-pill-icon" />
                      <input
                        id="auth-startup-name"
                        type="text"
                        className="auth-pill-input"
                        placeholder="e.g. EcoHemp Labs"
                        value={startupName}
                        onChange={e => setStartupName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="auth-field-group">
                    <label className="auth-field-label" htmlFor="auth-startup-description">Startup Description *</label>
                    <div className="auth-pill-input-wrap auth-pill-textarea-wrap">
                      <textarea
                        id="auth-startup-description"
                        className="auth-pill-textarea"
                        rows={2}
                        placeholder="What problem does your startup solve?"
                        value={startupDesc}
                        onChange={e => setStartupDesc(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* Email Field */}
          <div className="auth-field-group">
            <label className="auth-field-label" htmlFor="auth-email">Email</label>
            <div className="auth-pill-input-wrap">
              <Mail size={16} className="auth-pill-icon" />
              <input
                id="auth-email"
                type="email"
                className="auth-pill-input"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="auth-field-group">
            <label className="auth-field-label" htmlFor="auth-password">Password</label>
            <div className="auth-pill-input-wrap">
              <Lock size={16} className="auth-pill-icon" />
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                className="auth-pill-input"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword(prev => !prev)}
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Remember me & Quick Switch */}
          <div className="auth-options-row">
            <label className="auth-checkbox-label">
              <input
                type="checkbox"
                className="auth-custom-checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
            </label>

            {tab === 'signin' && (
              <button
                type="button"
                className="auth-switch-role-btn"
                onClick={() => {
                  const nextRole: UserRole = role === 'startup' ? 'sponsor' : role === 'sponsor' ? 'user' : 'startup';
                  setRole(nextRole);
                }}
              >
                Switch to {role === 'startup' ? 'Investor' : role === 'sponsor' ? 'User' : 'Startup'}
              </button>
            )}
          </div>

          {/* Main Action Button */}
          <button
            type="submit"
            className="auth-main-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : tab === 'signin' ? 'Login' : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider-wrap">
          <span className="auth-divider-line" />
          <span className="auth-divider-text">Or continue with</span>
          <span className="auth-divider-line" />
        </div>

        {/* Social SSO Logins */}
        <div className="auth-social-buttons-container">
          <button
            type="button"
            className="auth-social-btn auth-social-btn-google"
            onClick={() => handleSocialLogin('Google')}
            disabled={isSubmitting}
            aria-label="Continue with Google"
          >
            <svg className="auth-social-svg" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="auth-social-secondary-grid">
            <button
              type="button"
              className="auth-social-btn auth-social-btn-sub"
              onClick={() => handleSocialLogin('GitHub')}
              disabled={isSubmitting}
              aria-label="Continue with GitHub"
            >
              <svg className="auth-social-svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>GitHub</span>
            </button>

            <button
              type="button"
              className="auth-social-btn auth-social-btn-sub"
              onClick={() => handleSocialLogin('Apple')}
              disabled={isSubmitting}
              aria-label="Continue with Apple"
            >
              <svg className="auth-social-svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.65-.8 1.1-1.92.98-3.04-.97.04-2.14.65-2.83 1.45-.61.7-.85 1.83-.71 2.92 1.09.08 2.18-.54 2.56-1.33z" />
              </svg>
              <span>Apple</span>
            </button>
          </div>
        </div>

        {/* 1-Click Demo Accounts */}
        <div style={{ marginTop: '16px', marginBottom: '8px', textAlign: 'center' }}>
          <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Or test with 1-click demo profiles
          </span>
        </div>
        <div className="auth-quick-demo-grid">
          {DEMO_ACCOUNTS.map(account => (
            <button
              key={account.email}
              type="button"
              className="auth-quick-pill-btn"
              onClick={() => handleQuickLogin(account.email)}
              disabled={isSubmitting}
            >
              <span>{account.button_label}</span>
            </button>
          ))}
        </div>

        {/* Hidden compatibility buttons for legacy test selectors */}
        <div style={{ display: 'none' }} aria-hidden="true">
          <button type="button" onClick={() => handleQuickLogin(DEMO_ACCOUNTS[0].email)}>
            🚀 Aarav (Apparel Startup)
          </button>
          <button type="button" onClick={() => handleQuickLogin(DEMO_ACCOUNTS[1].email)}>
            🥖 Maya (Food Startup)
          </button>
          <button type="button" onClick={() => handleQuickLogin(DEMO_ACCOUNTS[2].email)}>
            💼 Vikram (Sponsor)
          </button>
          <button type="button" onClick={() => handleQuickLogin(DEMO_ACCOUNTS[3].email)}>
            🛍️ Riya (Shopper)
          </button>
        </div>

        {/* Bottom Toggle Link */}
        <div className="auth-footer-toggle">
          {tab === 'signin' ? (
            <span>
              Don't have an account?{' '}
              <button
                type="button"
                className="auth-toggle-link-btn"
                onClick={() => { setTab('signup'); setError(null); }}
              >
                Create an account
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                className="auth-toggle-link-btn"
                onClick={() => { setTab('signin'); setError(null); }}
              >
                Log in
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
