import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { UserRole } from '@droptest/shared';
import { X, Sparkles, User, Briefcase, Rocket, LogIn, UserPlus } from 'lucide-react';

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
  const [tab, setTab] = useState<'signin' | 'signup'>(initialTab);
  const [role, setRole] = useState<UserRole>(defaultRole);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [startupName, setStartupName] = useState('');
  const [startupDesc, setStartupDesc] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      await quickDemoLogin(demoEmail);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 'var(--space-4)'
    }}>
      <div className="modal-container" style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '480px',
        boxShadow: 'var(--shadow-xl)',
        overflow: 'hidden',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: 'var(--space-4) var(--space-5)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--color-surface-hover)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 700, fontSize: 'var(--font-size-md)', color: 'var(--color-text-primary)' }}>
              {tab === 'signin' ? 'Sign In to DROPTEST' : 'Create an Account'}
            </span>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '4px', borderRadius: '50%', border: 'none', background: 'transparent' }}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-surface)'
        }}>
          <button
            type="button"
            style={{
              flex: 1,
              padding: '10px',
              fontSize: '13px',
              fontWeight: 600,
              background: tab === 'signin' ? 'var(--color-surface)' : 'var(--color-surface-hover)',
              border: 'none',
              borderBottom: tab === 'signin' ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: tab === 'signin' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              cursor: 'pointer'
            }}
            onClick={() => { setTab('signin'); setError(null); }}
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <LogIn size={14} /> Sign In
            </span>
          </button>
          <button
            type="button"
            style={{
              flex: 1,
              padding: '10px',
              fontSize: '13px',
              fontWeight: 600,
              background: tab === 'signup' ? 'var(--color-surface)' : 'var(--color-surface-hover)',
              border: 'none',
              borderBottom: tab === 'signup' ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: tab === 'signup' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              cursor: 'pointer'
            }}
            onClick={() => { setTab('signup'); setError(null); }}
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <UserPlus size={14} /> Create Account
            </span>
          </button>
        </div>

        {/* Form Body */}
        <div style={{ padding: 'var(--space-5)', overflowY: 'auto' }}>
          {error && (
            <div role="alert" style={{
              background: 'var(--color-danger-bg)',
              border: '1px solid var(--color-danger-border)',
              color: 'var(--color-danger)',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              fontSize: '12px',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {tab === 'signup' && (
              <>
                {/* 3 Role Selection Cards */}
                <div>
                  <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Select Your Role
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setRole('startup')}
                      style={{
                        padding: '10px 8px',
                        borderRadius: 'var(--radius-md)',
                        border: `1.5px solid ${role === 'startup' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        background: role === 'startup' ? 'var(--color-primary-subtle)' : 'var(--color-surface)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Rocket size={18} color={role === 'startup' ? 'var(--color-primary)' : 'var(--color-text-muted)'} />
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Startup</span>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Publish & test</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('sponsor')}
                      style={{
                        padding: '10px 8px',
                        borderRadius: 'var(--radius-md)',
                        border: `1.5px solid ${role === 'sponsor' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        background: role === 'sponsor' ? 'var(--color-primary-subtle)' : 'var(--color-surface)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Briefcase size={18} color={role === 'sponsor' ? 'var(--color-primary)' : 'var(--color-text-muted)'} />
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Sponsor</span>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Back & support</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('user')}
                      style={{
                        padding: '10px 8px',
                        borderRadius: 'var(--radius-md)',
                        border: `1.5px solid ${role === 'user' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        background: role === 'user' ? 'var(--color-primary-subtle)' : 'var(--color-surface)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <User size={18} color={role === 'user' ? 'var(--color-primary)' : 'var(--color-text-muted)'} />
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Community</span>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Save & feedback</span>
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Display Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Aarav Sharma"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    required
                  />
                </div>

                {role === 'startup' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Startup / Brand Name *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. EcoThreads Apparel"
                        value={startupName}
                        onChange={e => setStartupName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Startup Short Description</label>
                      <textarea
                        className="form-textarea"
                        rows={2}
                        placeholder="What problem does your startup solve?"
                        value={startupDesc}
                        onChange={e => setStartupDesc(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </>
            )}

            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password *</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter password (min 6 characters)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ marginTop: '8px', padding: '10px', fontSize: '13px', width: '100%' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : tab === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div style={{
            marginTop: '20px',
            paddingTop: '14px',
            borderTop: '1px solid var(--color-border)',
            background: 'var(--color-surface-hover)',
            padding: '12px',
            borderRadius: 'var(--radius-md)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Sparkles size={14} color="var(--color-primary)" />
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                1-Click Demo Accounts (For Judging)
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '11px', padding: '5px 8px', justifyContent: 'flex-start' }}
                onClick={() => handleQuickLogin('founder@ecothreads.in')}
                disabled={isSubmitting}
              >
                🚀 Aarav (Apparel Startup)
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '11px', padding: '5px 8px', justifyContent: 'flex-start' }}
                onClick={() => handleQuickLogin('founder@artisanbake.in')}
                disabled={isSubmitting}
              >
                🥖 Maya (Food Startup)
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '11px', padding: '5px 8px', justifyContent: 'flex-start' }}
                onClick={() => handleQuickLogin('sponsor@indiagrowth.vc')}
                disabled={isSubmitting}
              >
                💼 Vikram (Sponsor)
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '11px', padding: '5px 8px', justifyContent: 'flex-start' }}
                onClick={() => handleQuickLogin('riya@gmail.com')}
                disabled={isSubmitting}
              >
                🛍️ Riya (Shopper)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
