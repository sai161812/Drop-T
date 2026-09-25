import React from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, FlaskConical, MessageCircleMore, Sparkles } from 'lucide-react';
import './LandingPage.css';

interface LandingPageProps {
  onExplore: () => void;
  onSignIn: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onExplore, onSignIn }) => (
  <div className="landing-page">
    <div className="landing-atmosphere" aria-hidden="true">
      <div className="landing-rays" />
      <div className="landing-glow" />
    </div>

    <header className="landing-nav-wrap">
      <nav className="landing-nav" aria-label="Main navigation">
        <a className="landing-brand" href="/" aria-label="DROPTEST home">
          <span className="landing-brand-mark"><span /></span>
          <span className="landing-brand-name">drop<span>test</span></span>
        </a>

        <div className="landing-nav-links">
          <a href="#how-it-works">How it works</a>
          <a href="#built-for-founders">For founders</a>
        </div>

        <div className="landing-nav-actions">
          <button className="landing-signin" type="button" onClick={onSignIn}>Sign in</button>
          <button className="landing-nav-cta" type="button" onClick={onExplore}>
            Explore launches <ArrowUpRight size={15} />
          </button>
        </div>
      </nav>
    </header>

    <main>
      <section className="landing-hero" aria-labelledby="landing-heading">
        <div className="landing-hero-content">
          <div className="landing-eyebrow"><span className="landing-eyebrow-dot" /> FOR THE MOMENT BEFORE LAUNCH</div>
          <h1 id="landing-heading">Make the next move<br /><span>with more clarity.</span></h1>
          <p className="landing-hero-copy">
            Put your product in front of a community, gather structured feedback, and pressure-test your assumptions before you commit.
          </p>
          <div className="landing-hero-actions">
            <button className="landing-button landing-button-primary" type="button" onClick={onExplore}>
              Explore product launches <ArrowRight size={17} />
            </button>
            <a className="landing-button landing-button-secondary" href="#how-it-works">
              See how it works <ArrowDown size={16} />
            </a>
          </div>
          <p className="landing-honesty-note"><Sparkles size={14} /> Real community feedback stays separate from AI-assisted simulations.</p>
        </div>

        <div className="landing-signal-preview" aria-label="Two distinct ways to learn before launch">
          <div className="landing-preview-topline">
            <span className="landing-preview-kicker">A clearer path from idea to launch</span>
            <span className="landing-preview-indicator"><i /> YOUR WORKSPACE</span>
          </div>
          <div className="landing-preview-grid">
            <article className="landing-preview-card landing-preview-community">
              <div className="landing-preview-icon"><MessageCircleMore size={20} /></div>
              <div>
                <span className="landing-preview-label">COMMUNITY</span>
                <h2>Hear from real people</h2>
                <p>Share a product and collect structured responses from the people who see it.</p>
              </div>
              <span className="landing-preview-arrow"><ArrowUpRight size={17} /></span>
            </article>
            <article className="landing-preview-card landing-preview-lab">
              <div className="landing-preview-icon"><FlaskConical size={20} /></div>
              <div>
                <span className="landing-preview-label">PRIVATE SYNTHETIC LAB</span>
                <h2>Pressure-test assumptions</h2>
                <p>Explore possible objections with AI-assisted profiles—not a substitute for real buyers.</p>
              </div>
              <span className="landing-preview-arrow"><ArrowUpRight size={17} /></span>
            </article>
          </div>
          <div className="landing-preview-foot"><span>01&nbsp; Share a product</span><span className="landing-foot-line" /><span>02&nbsp; Learn what to test</span><span className="landing-foot-line" /><span>03&nbsp; Take your next step</span></div>
        </div>

        <a className="landing-scroll-cue" href="#how-it-works"><span>SCROLL TO EXPLORE</span><ArrowDown size={14} /></a>
      </section>

      <section className="landing-how" id="how-it-works" aria-labelledby="how-heading">
        <div className="landing-section-heading">
          <span className="landing-section-kicker">A SMALLER LEAP OF FAITH</span>
          <h2 id="how-heading">Move forward with<br /><span>better questions.</span></h2>
          <p>DROPTEST gives early founders a place to learn before launch—without pretending a simulation is proof.</p>
        </div>
        <div className="landing-steps">
          <article className="landing-step">
            <span className="landing-step-number">01</span>
            <h3>Share what you’re building</h3>
            <p>Publish a product proposal with the details people need to respond thoughtfully.</p>
          </article>
          <article className="landing-step">
            <span className="landing-step-number">02</span>
            <h3>Listen to real responses</h3>
            <p>Collect structured community feedback and see it clearly, separate from every other signal.</p>
          </article>
          <article className="landing-step" id="built-for-founders">
            <span className="landing-step-number">03</span>
            <h3>Test the assumptions</h3>
            <p>Use the private Synthetic Lab to explore trade-offs and decide what to validate with real buyers next.</p>
          </article>
        </div>
      </section>

      <section className="landing-bottom-cta">
        <div>
          <span className="landing-section-kicker">YOUR NEXT STEP STARTS HERE</span>
          <h2>Building something?</h2>
          <p>Explore early product launches or sign in to share your own.</p>
        </div>
        <div className="landing-bottom-actions">
          <button type="button" className="landing-button landing-button-primary" onClick={onExplore}>Explore launches <ArrowRight size={17} /></button>
          <button type="button" className="landing-bottom-signin" onClick={onSignIn}>Sign in to DROPTEST <ArrowUpRight size={15} /></button>
        </div>
      </section>
    </main>

    <footer className="landing-footer">
      <a className="landing-brand landing-footer-brand" href="/" aria-label="DROPTEST home">
        <span className="landing-brand-mark"><span /></span>
        <span className="landing-brand-name">drop<span>test</span></span>
      </a>
      <span>Real feedback. Clearer next steps.</span>
      <span>© {new Date().getFullYear()} DROPTEST</span>
    </footer>
  </div>
);
