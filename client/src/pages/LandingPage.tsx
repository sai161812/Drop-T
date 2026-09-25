import React from 'react';
import { 
  ArrowRight, 
  ArrowUpRight, 
  FlaskConical, 
  MessageCircleMore, 
  ShieldCheck, 
  Search, 
  Coins, 
  CheckCircle2,
  Users
} from 'lucide-react';
import { LightRays } from '../components/LightRays/LightRays.js';
import './LandingPage.css';

interface LandingPageProps {
  onExplore: () => void;
  onSignIn: () => void;
  onOpenProduct?: (productId: string) => void;
}

const raySettings = {
  raysOrigin: 'top-center' as const,
  raysColor: '#ffffff',
  raysSpeed: 0.9,
  lightSpread: 0.6,
  rayLength: 2.8,
  pulsating: false,
  fadeDistance: 1.2,
  saturation: 1.0,
  followMouse: true,
  mouseInfluence: 0.08,
  noiseAmount: 0.0,
  distortion: 0.0,
};

export const LandingPage: React.FC<LandingPageProps> = ({ onExplore, onSignIn, onOpenProduct }) => {
  return (
    <div className="landing-page-full">
      {/* 1. Full-Bleed Ambient WebGL Light Rays Layer */}
      <div className="landing-ambient-layer" aria-hidden="true">
        <LightRays {...raySettings} className="landing-rays-canvas" />
        <div className="landing-ambient-glow" />
      </div>

      {/* 2. Top Enterprise Navigation Bar */}
      <header className="landing-header">
        <nav className="landing-nav-inner" aria-label="Main navigation">
          <a href="/" className="landing-brand-link" onClick={(e) => { e.preventDefault(); onExplore(); }} aria-label="DROPTEST home">
            <span className="brand-dot-logo">
              <span className="brand-dot-core" />
            </span>
            <span className="brand-title-text">drop<span className="brand-accent">test</span></span>
          </a>

          <div className="landing-nav-center">
            <a href="#capabilities" className="nav-anchor-link">Capabilities</a>
            <a href="#launches" className="nav-anchor-link">Featured Launches</a>
            <a href="#methodology" className="nav-anchor-link">Methodology</a>
            <a href="#how-it-works" className="nav-anchor-link">Workflow</a>
          </div>

          <div className="landing-nav-right">
            <button type="button" className="nav-signin-btn" onClick={onSignIn}>
              Sign In
            </button>
            <button type="button" className="nav-primary-cta" onClick={onExplore}>
              Explore Launches <ArrowUpRight size={14} />
            </button>
          </div>
        </nav>
      </header>

      {/* 3. Hero Section (Full Viewport Height) */}
      <main>
        <section className="landing-hero-section" aria-labelledby="hero-headline">
          <div className="hero-badge-pill">
            <span className="pill-indicator" />
            <span className="pill-text">AI MARKET RESEARCH & 50-PERSONA SYNTHETIC LAB</span>
          </div>

          <h1 id="hero-headline" className="hero-main-title">
            Validate your product<br />
            <span className="hero-gradient-text">before you commit.</span>
          </h1>

          <p className="hero-lead-paragraph">
            DROPTEST combines structured community feedback and non-binding sponsor support with a private 50-persona synthetic lab that benchmarks competitor pricing, materials, and buyer objections.
          </p>

          <div className="hero-cta-group">
            <button type="button" className="btn-hero-primary" onClick={onExplore}>
              Explore Live Launches <ArrowRight size={16} />
            </button>
            <button type="button" className="btn-hero-secondary" onClick={onSignIn}>
              <FlaskConical size={16} /> Open Synthetic Lab
            </button>
          </div>

          {/* Stats Bar */}
          <div className="hero-stats-strip">
            <div className="stat-item">
              <span className="stat-number">50</span>
              <span className="stat-label">Synthetic Personas</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">20 / 20 / 10</span>
              <span className="stat-label">Segment Split</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">1-Click</span>
              <span className="stat-label">Structured Feedback</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">Live</span>
              <span className="stat-label">Competitor Search</span>
            </div>
          </div>
        </section>

        {/* 4. Core Capabilities Grid */}
        <section className="landing-section" id="capabilities" aria-labelledby="capabilities-heading">
          <div className="section-header-block">
            <span className="section-kicker">ENGINE CAPABILITIES</span>
            <h2 id="capabilities-heading">Three Rigorous Validation Signals</h2>
            <p>Every product idea requires multiple angles of scrutiny. DROPTEST provides clear, non-overlapping signals.</p>
          </div>

          <div className="capabilities-grid">
            <div className="capability-card" onClick={onExplore}>
              <div className="card-top-icon community-color">
                <MessageCircleMore size={22} />
              </div>
              <h3>Structured Community Feedback</h3>
              <p>Collect verified 1-response per account feedback (Yes/Maybe/No, key decision factor, and qualitative reason) from real community shoppers.</p>
              <ul className="card-feature-list">
                <li><CheckCircle2 size={14} /> One editable response per user</li>
                <li><CheckCircle2 size={14} /> Save / Bookmark tracking</li>
                <li><CheckCircle2 size={14} /> Founder-only response breakdown</li>
              </ul>
            </div>

            <div className="capability-card highlighted" onClick={onSignIn}>
              <div className="card-top-icon lab-color">
                <FlaskConical size={22} />
              </div>
              <h3>50-Persona Synthetic Lab</h3>
              <p>Simulate 50 deterministic buyer personas (20 Intended, 20 Adjacent, 10 Contrasting) to test price elasticity, objection points, and feature-fit.</p>
              <ul className="card-feature-list">
                <li><CheckCircle2 size={14} /> Stable profile seed generation</li>
                <li><CheckCircle2 size={14} /> Private manufacturing cost analysis</li>
                <li><CheckCircle2 size={14} /> Optional paired 100-evaluation A/B mode</li>
              </ul>
            </div>

            <div className="capability-card" onClick={onSignIn}>
              <div className="card-top-icon search-color">
                <Search size={22} />
              </div>
              <h3>Autonomous Market Research</h3>
              <p>Real-time search engine integration retrieves comparable real-world products, automatically extracting price points and feature facts with verified sources.</p>
              <ul className="card-feature-list">
                <li><CheckCircle2 size={14} /> Automated competitor lookup</li>
                <li><CheckCircle2 size={14} /> Verified source URL snapshotting</li>
                <li><CheckCircle2 size={14} /> Persona citation injection</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 5. Featured Live Launches Section */}
        <section className="landing-section" id="launches" aria-labelledby="launches-heading">
          <div className="section-header-block">
            <span className="section-kicker">ACTIVE VALIDATION</span>
            <h2 id="launches-heading">Live Product Launches</h2>
            <p>Explore real startup concepts currently gathering structured feedback and sponsor support.</p>
          </div>

          <div className="launches-grid">
            <article 
              className="launch-card" 
              onClick={() => onOpenProduct ? onOpenProduct('prod_hemp_summer_tee_1') : onExplore()}
            >
              <div className="launch-media-wrap">
                <img 
                  src="/images/products/sage-hemp-tee.jpg" 
                  alt="Organic Hemp Everyday Summer Tee"
                  onError={(e) => { e.currentTarget.src = '/images/products/organic-hemp-summer-tee.png'; }}
                />
                <span className="launch-stage-tag">Validation Phase</span>
              </div>
              <div className="launch-body">
                <div className="launch-header-row">
                  <span className="launch-founder">EcoHemp Labs · Kavita Rao</span>
                  <span className="launch-price">₹999</span>
                </div>
                <h3>Organic Hemp Everyday Summer Tee</h3>
                <p>55% Himalayan Hemp, 45% Organic Cotton. Breathable natural casualwear engineered for heat and high durability.</p>
                <div className="launch-footer-stats">
                  <span><CheckCircle2 size={13} /> Verified Community Feedback</span>
                  <span><Coins size={13} /> ₹500 Sponsor Backing</span>
                </div>
              </div>
            </article>

            <article 
              className="launch-card" 
              onClick={() => onOpenProduct ? onOpenProduct('prod_cold_brew_press_2') : onExplore()}
            >
              <div className="launch-media-wrap">
                <img 
                  src="/images/products/cold-brew-press-tumbler.png" 
                  alt="Artisanal Cold Brew Press & Ceramic Tumbler"
                />
                <span className="launch-stage-tag">Prototype Phase</span>
              </div>
              <div className="launch-body">
                <div className="launch-header-row">
                  <span className="launch-founder">TerraBrew Innovations · Rohit Verma</span>
                  <span className="launch-price">₹1,850</span>
                </div>
                <h3>Artisanal Cold Brew Press & Ceramic Tumbler</h3>
                <p>Stoneware ceramic immersion brewer with dual 304 stainless steel micro-filters for sediment-free cold extraction.</p>
                <div className="launch-footer-stats">
                  <span><Users size={13} /> Active Shopper Reviews</span>
                  <span><FlaskConical size={13} /> Synthetic Lab Tested</span>
                </div>
              </div>
            </article>
          </div>

          <div className="launches-cta-row">
            <button type="button" className="btn-browse-all" onClick={onExplore}>
              View All Launches in Explore Feed <ArrowRight size={15} />
            </button>
          </div>
        </section>

        {/* 6. Scientific Methodology & Signal Separation */}
        <section className="landing-section" id="methodology" aria-labelledby="methodology-heading">
          <div className="methodology-banner">
            <div className="methodology-icon">
              <ShieldCheck size={32} />
            </div>
            <div className="methodology-text">
              <h3 id="methodology-heading">Methodological Rigor & Data Integrity</h3>
              <p>
                DROPTEST strictly maintains separation between real human feedback and synthetic AI simulations. Simulated persona responses are transparent hypotheses for pressure-testing assumptions, never masqueraded as real buyer commitments. Sponsor proposals are non-binding expressions of interest that open founder dialogues without speculative transaction fees.
              </p>
            </div>
          </div>
        </section>

        {/* 7. Step-by-Step Workflow */}
        <section className="landing-section" id="how-it-works" aria-labelledby="workflow-heading">
          <div className="section-header-block">
            <span className="section-kicker">WORKFLOW</span>
            <h2 id="workflow-heading">How DROPTEST Works</h2>
            <p>A systematic framework to validate your next product move before writing code or manufacturing inventory.</p>
          </div>

          <div className="workflow-steps-grid">
            <div className="workflow-step-card">
              <span className="step-badge">01</span>
              <h3>Publish Product Blueprint</h3>
              <p>Define product specifications, materials, sizing, price points, and target geographic markets in minutes.</p>
            </div>

            <div className="workflow-step-card">
              <span className="step-badge">02</span>
              <h3>Autonomous Competitor Search</h3>
              <p>Search real-world alternatives to benchmark market pricing, extracting structured facts to ground persona simulations.</p>
            </div>

            <div className="workflow-step-card">
              <span className="step-badge">03</span>
              <h3>50-Persona Simulation & Support</h3>
              <p>Evaluate 50 personas across 3 distinct segments while receiving real community feedback and non-binding sponsor support offers.</p>
            </div>
          </div>
        </section>

        {/* 8. Bottom Conversion Call to Action */}
        <section className="landing-cta-banner">
          <div className="cta-inner-card">
            <h2>Ready to pressure-test your product concept?</h2>
            <p>Join founders and sponsors validating early-stage concepts with real clarity.</p>
            <div className="cta-button-row">
              <button type="button" className="btn-hero-primary" onClick={onExplore}>
                Explore Product Launches <ArrowRight size={16} />
              </button>
              <button type="button" className="btn-hero-secondary" onClick={onSignIn}>
                Sign In / Sign Up
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* 9. Enterprise Clean Footer */}
      <footer className="landing-footer-full">
        <div className="footer-container">
          <div className="footer-brand-col">
            <a href="/" className="landing-brand-link" aria-label="DROPTEST home">
              <span className="brand-dot-logo"><span className="brand-dot-core" /></span>
              <span className="brand-title-text">drop<span className="brand-accent">test</span></span>
            </a>
            <p className="footer-tagline">
              Autonomous Market Research & Pre-Launch Validation Workbench.
            </p>
          </div>

          <div className="footer-links-col">
            <span className="footer-col-title">Navigation</span>
            <a href="#capabilities">Capabilities</a>
            <a href="#launches">Featured Launches</a>
            <a href="#methodology">Methodology</a>
            <a href="#how-it-works">Workflow</a>
          </div>

          <div className="footer-links-col">
            <span className="footer-col-title">Platform</span>
            <button type="button" className="footer-text-btn" onClick={onExplore}>Explore Products</button>
            <button type="button" className="footer-text-btn" onClick={onSignIn}>Synthetic Lab</button>
            <button type="button" className="footer-text-btn" onClick={onSignIn}>Sign In / Sign Up</button>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <span>© {new Date().getFullYear()} DROPTEST. All rights reserved.</span>
          <span>Designed with precision for early product founders.</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
