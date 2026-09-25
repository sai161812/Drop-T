import React, { useState } from 'react';
import { LightRays } from '../components/LightRays/LightRays.js';
import './LandingPage.css';

interface LandingPageProps {
  onExplore: () => void;
  onSignIn: () => void;
  onOpenProduct?: (productId: string) => void;
}

const previewSettings = {
  raysOrigin: 'top-center' as const,
  raysColor: '#ffffff',
  raysSpeed: 1,
  lightSpread: 0.5,
  rayLength: 3,
  pulsating: false,
  fadeDistance: 1,
  saturation: 1,
  followMouse: true,
  mouseInfluence: 0.1,
  noiseAmount: 0,
  distortion: 0,
};

export const LandingPage: React.FC<LandingPageProps> = ({ onExplore, onSignIn }) => {
  const [showContent, setShowContent] = useState(true);

  return (
    <div className="landing-root">
      <main className="preview" aria-label="DROPTEST Light Rays Landing Page">
        <div className="rays" aria-hidden="true">
          <LightRays {...previewSettings} className="custom-rays" />
        </div>

        {showContent && (
          <>
            <header className="demo-navbar" aria-label="Main navigation">
              <a href="/" className="demo-brand" onClick={(e) => { e.preventDefault(); onExplore(); }} aria-label="DROPTEST home">
                <span className="demo-brand-mark"><span /></span>
                <span className="demo-brand-name">drop<span>test</span></span>
              </a>
              <div className="demo-nav-items">
                <button type="button" className="nav-text-btn" onClick={onExplore}>Explore Launches</button>
                <button type="button" className="nav-text-btn" onClick={onSignIn}>Synthetic Lab</button>
                <button type="button" className="demo-signup" onClick={onSignIn}>Sign In / Sign Up</button>
              </div>
            </header>

            <div className="demo-content">
              <div className="demo-pill">
                <span className="new-label">NEW</span>
                <span>Pre-Launch Validation</span>
              </div>
              <h1>
                Validate your product<br className="desktop-break" /> before you commit
              </h1>
              <p className="demo-subtitle">
                Real community feedback. 50-persona synthetic market simulation.
              </p>
              <div className="demo-actions" aria-label="Call to action buttons">
                <button type="button" className="demo-primary" onClick={onExplore}>
                  Get started
                </button>
                <button type="button" className="demo-secondary" onClick={onSignIn}>
                  Sign in
                </button>
              </div>
            </div>
          </>
        )}

        <button
          type="button"
          role="switch"
          aria-checked={showContent}
          className="content-toggle"
          onClick={() => setShowContent(value => !value)}
          aria-label="Toggle demo content"
        >
          <span>Demo Content</span>
          <span className={`switch-track${showContent ? ' is-on' : ''}`} aria-hidden="true">
            <span className="switch-thumb" />
          </span>
        </button>
      </main>
    </div>
  );
};

export default LandingPage;
