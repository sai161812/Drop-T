import React, { useEffect, useState } from 'react';
import type { ProductPublicSummary, UserRole } from '@droptest/shared';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { ElectricBrandMark } from '../components/Common/ElectricBrandMark.js';
import { LightRays } from '../components/LightRays/LightRays.js';
import './LandingPage.css';

interface LandingPageProps {
  onExplore: () => void;
  onSignIn: (role?: UserRole) => void;
  onOpenProduct?: (productId: string) => void;
}

const raySettings = {
  raysOrigin: 'top-center' as const,
  raysSpeed: 0.7,
  lightSpread: 0.48,
  rayLength: 2.6,
  pulsating: false,
  fadeDistance: 1.15,
  followMouse: true,
  mouseInfluence: 0.06,
  distortion: 0,
};

const HEMP_PRODUCT = 'Organic Hemp Everyday Summer Tee';
const BREW_PRODUCT = 'Artisanal Cold Brew Press & Ceramic Tumbler';

export const LandingPage: React.FC<LandingPageProps> = ({ onExplore, onSignIn, onOpenProduct }) => {
  const [featuredProducts, setFeaturedProducts] = useState<ProductPublicSummary[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    const loadFeaturedProducts = async () => {
      try {
        const response = await fetch('/api/products?limit=50', { signal: controller.signal });
        if (!response.ok) return;
        const data = await response.json() as { products?: ProductPublicSummary[] };
        setFeaturedProducts(data.products || []);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    };

    void loadFeaturedProducts();
    return () => controller.abort();
  }, []);

  const getFeaturedProduct = (name: string) => featuredProducts.find(item => item.name === name);

  const openFeaturedProduct = (event: React.MouseEvent<HTMLAnchorElement>, name: string) => {
    event.preventDefault();
    const product = featuredProducts.find(item => item.name === name);
    if (product && onOpenProduct) {
      onOpenProduct(product.id);
      return;
    }
    onExplore();
  };

  return (
    <div className="landing-page-full">
      <div className="landing-ambient-layer" aria-hidden="true">
        <LightRays {...raySettings} className="landing-rays-canvas" />
      </div>

      <header className="landing-header">
        <nav className="landing-nav-inner" aria-label="Main navigation">
          <a href="/" className="landing-brand-link" aria-label="DROPTEST home">
            <ElectricBrandMark />
            <span className="brand-title-text">DROPTEST</span>
          </a>

          <div className="landing-nav-center">
            <a href="#platform" className="nav-anchor-link">Platform</a>
            <a href="#products" className="nav-anchor-link">Products</a>
            <a href="#method" className="nav-anchor-link">Method</a>
          </div>

          <div className="landing-nav-right">
            <button type="button" className="nav-text-action" onClick={onExplore}>Explore</button>
            <div className="signup-dropdown-wrapper">
              <button
                type="button"
                className="nav-primary-cta"
                onClick={() => onSignIn()}
                aria-haspopup="menu"
              >
                Sign In / Sign Up
              </button>
              <div className="signup-dropdown-menu" role="menu">
                <button
                  type="button"
                  className="signup-dropdown-item"
                  role="menuitem"
                  onClick={() => onSignIn('user')}
                >
                  <span className="dropdown-item-num">1.</span>
                  <span>User Login</span>
                </button>
                <button
                  type="button"
                  className="signup-dropdown-item"
                  role="menuitem"
                  onClick={() => onSignIn('startup')}
                >
                  <span className="dropdown-item-num">2.</span>
                  <span>Startup Login</span>
                </button>
                <button
                  type="button"
                  className="signup-dropdown-item"
                  role="menuitem"
                  onClick={() => onSignIn('sponsor')}
                >
                  <span className="dropdown-item-num">3.</span>
                  <span>Investor Login</span>
                </button>
              </div>
            </div>
          </div>
        </nav>
      </header>

      <main>
        <section className="landing-hero-section" aria-labelledby="hero-headline">
          <div className="hero-kicker-row">
            <span>Product validation workspace</span>
            <span>For early-stage teams</span>
          </div>

          <div className="hero-editorial-grid">
            <div className="hero-copy">
              <h1 id="hero-headline" className="hero-main-title">
                Validate your product <br />before you commit.
              </h1>
            </div>
            <div className="hero-side-copy">
              <span className="section-index">01 / OVERVIEW</span>
              <p>
                Publish a clear product proposal. Collect structured feedback from people. Review market references and 50 simulated buyer profiles before the expensive decisions begin.
              </p>
              <div className="hero-cta-group">
                <button type="button" className="btn-hero-primary" onClick={onExplore}>
                  Explore products <ArrowRight size={17} />
                </button>
                <button type="button" className="btn-hero-secondary" onClick={() => onSignIn()}>
                  Start a review
                </button>
              </div>
            </div>
          </div>

          <div className="hero-stats-strip" aria-label="Platform metrics">
            <div className="stat-item">
              <span className="stat-label">Buyer profiles</span>
              <span className="stat-number">50</span>
              <span className="stat-note">per single-product review</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Audience groups</span>
              <span className="stat-number">03</span>
              <span className="stat-note">intended / adjacent / contrasting</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Community input</span>
              <span className="stat-number">01</span>
              <span className="stat-note">editable response per account</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Research set</span>
              <span className="stat-number">05</span>
              <span className="stat-note">selected comparable sources</span>
            </div>
          </div>
        </section>

        <section className="landing-section capabilities-section" id="platform" aria-labelledby="capabilities-heading">
          <div className="section-heading-grid">
            <span className="section-index">02 / PLATFORM</span>
            <h2 id="capabilities-heading">Three signals.<br />No blurred lines.</h2>
            <p>Each source answers a different question. DROPTEST keeps them separate so founders can see what is observed, what is sourced, and what is simulated.</p>
          </div>

          <div className="capabilities-grid">
            <a href="/lab" className="capability-block capability-primary" onClick={(event) => { event.preventDefault(); onSignIn(); }}>
              <div className="capability-meta">
                <span>01</span>
                <span>Private founder workspace</span>
              </div>
              <div className="capability-content">
                <span className="card-eyebrow">50-persona synthetic lab</span>
                <h3>Find objections before they become inventory.</h3>
                <p>Review the same proposal across intended, adjacent, and contrasting buyer profiles. Inspect every reason and compare two options when the decision calls for it.</p>
              </div>
              <div className="technical-row">
                <span>20 intended</span>
                <span>20 adjacent</span>
                <span>10 contrasting</span>
              </div>
            </a>

            <a href="/lab" className="capability-block" onClick={(event) => { event.preventDefault(); onSignIn(); }}>
              <div className="capability-meta">
                <span>02</span>
                <ArrowUpRight size={18} />
              </div>
              <div className="capability-content">
                <span className="card-eyebrow">Comparable-product research</span>
                <h3>Put the proposal next to the market.</h3>
                <p>Search real products, select relevant references, and retain source URLs beside the facts used in the review.</p>
              </div>
              <span className="capability-link">Open the research workflow</span>
            </a>

            <a href="/explore" className="capability-block" onClick={(event) => { event.preventDefault(); onExplore(); }}>
              <div className="capability-meta">
                <span>03</span>
                <ArrowUpRight size={18} />
              </div>
              <div className="capability-content">
                <span className="card-eyebrow">Community feedback</span>
                <h3>Ask one question people can answer.</h3>
                <p>Collect a yes, maybe, or no with the factor behind it. Saves and support proposals remain distinct from feedback counts.</p>
              </div>
              <span className="capability-link">Explore public products</span>
            </a>
          </div>
        </section>

        <section className="landing-section products-section" id="products" aria-labelledby="products-heading">
          <div className="section-heading-grid">
            <span className="section-index">03 / LIVE PRODUCTS</span>
            <h2 id="products-heading">Products under review.</h2>
            <p>Two published proposals from the live product feed. Open either record to see its question, details, and community response.</p>
          </div>

          <div className="product-spotlight-grid">
            <article className="product-sheet">
              <a
                href={getFeaturedProduct(HEMP_PRODUCT) ? `/product/${getFeaturedProduct(HEMP_PRODUCT)?.id}` : '/explore'}
                className="product-sheet-action"
                onClick={(event) => openFeaturedProduct(event, HEMP_PRODUCT)}
              >
                <div className="product-image-wrap">
                  <img src="/images/products/organic-hemp-summer-tee.png" alt="Sage green organic hemp T-shirt" />
                  <span className="product-sequence">P—01</span>
                </div>
                <div className="product-sheet-body">
                  <div className="product-title-row">
                    <div>
                      <span className="card-eyebrow">EcoHemp Labs / Apparel</span>
                      <h3>Organic Hemp Everyday Summer Tee</h3>
                    </div>
                    <span className="product-price">₹999</span>
                  </div>
                  <dl className="product-spec-grid">
                    <div><dt>Stage</dt><dd>Preparing to launch</dd></div>
                    <div><dt>Material</dt><dd>100% organic Himalayan hemp</dd></div>
                    <div><dt>Markets</dt><dd>Bangalore / Mumbai / Delhi NCR</dd></div>
                    <div><dt>Question</dt><dd>Regular fit or athletic fit?</dd></div>
                  </dl>
                  <span className="product-open-link">Open product <ArrowRight size={16} /></span>
                </div>
              </a>
            </article>

            <article className="product-sheet">
              <a
                href={getFeaturedProduct(BREW_PRODUCT) ? `/product/${getFeaturedProduct(BREW_PRODUCT)?.id}` : '/explore'}
                className="product-sheet-action"
                onClick={(event) => openFeaturedProduct(event, BREW_PRODUCT)}
              >
                <div className="product-image-wrap">
                  <img src="/images/products/cold-brew-press-tumbler.png" alt="Cold brew press beside a ceramic travel tumbler" />
                  <span className="product-sequence">P—02</span>
                </div>
                <div className="product-sheet-body">
                  <div className="product-title-row">
                    <div>
                      <span className="card-eyebrow">TerraBrew Innovations / Equipment</span>
                      <h3>Artisanal Cold Brew Press</h3>
                    </div>
                    <span className="product-price">₹1,499</span>
                  </div>
                  <dl className="product-spec-grid">
                    <div><dt>Stage</dt><dd>Prototype</dd></div>
                    <div><dt>Format</dt><dd>Immersion press + ceramic tumbler</dd></div>
                    <div><dt>Markets</dt><dd>Bangalore / Mumbai / Pune</dd></div>
                    <div><dt>Question</dt><dd>500 ml or 1,000 ml?</dd></div>
                  </dl>
                  <span className="product-open-link">Open product <ArrowRight size={16} /></span>
                </div>
              </a>
            </article>
          </div>
        </section>

        <section className="landing-section method-section" id="method" aria-labelledby="method-heading">
          <div className="method-principle">
            <span className="section-index">04 / METHOD</span>
            <h2 id="method-heading">Evidence stays evidence.<br />Hypotheses stay hypotheses.</h2>
          </div>
          <div className="method-copy">
            <p>Feedback from people is never mixed into simulated counts. Research keeps its source links. The 50-profile review surfaces questions and objections; it does not claim to predict demand.</p>
            <p>Support proposals record an amount and a message so founders can start a conversation. They are not payments, investments, or guarantees.</p>
          </div>
        </section>

        <section className="landing-section workflow-section" aria-labelledby="workflow-heading">
          <div className="section-heading-grid">
            <span className="section-index">05 / WORKFLOW</span>
            <h2 id="workflow-heading">One product.<br />Three deliberate steps.</h2>
            <p>Move from a proposal to a decision without losing track of where each signal came from.</p>
          </div>

          <ol className="workflow-timeline">
            <li>
              <span className="workflow-number">01</span>
              <h3>Publish the proposal</h3>
              <p>Define the product, buyer, price, markets, images, key specifications, and the question you need answered.</p>
            </li>
            <li>
              <span className="workflow-number">02</span>
              <h3>Collect the signals</h3>
              <p>Invite structured feedback, track saves, receive support proposals, and select comparable products.</p>
            </li>
            <li>
              <span className="workflow-number">03</span>
              <h3>Make the next decision</h3>
              <p>Review the evidence and simulated objections together, then change the offer, test another option, or move ahead.</p>
            </li>
          </ol>
        </section>

        <section className="landing-cta-banner">
          <div>
            <span className="section-index">06 / START</span>
            <h2>A better launch starts with a sharper question.</h2>
          </div>
          <div className="cta-action-block">
            <p>Put your product in front of people and pressure-test it before the next expensive commitment.</p>
            <button type="button" className="btn-cta-dark" onClick={() => onSignIn()}>
              Publish your product <ArrowRight size={17} />
            </button>
          </div>
        </section>
      </main>

      <footer className="landing-footer-full">
        <div className="footer-container">
          <a href="/" className="landing-brand-link" aria-label="DROPTEST home">
            <ElectricBrandMark />
            <span className="brand-title-text">DROPTEST</span>
          </a>
          <p>A product validation workspace for early-stage teams.</p>
          <div className="footer-actions">
            <button type="button" onClick={onExplore}>Browse products</button>
            <button type="button" onClick={() => onSignIn()}>Account access</button>
          </div>
        </div>
        <div className="footer-bottom-bar">
          <span>© {new Date().getFullYear()} DROPTEST</span>
          <span>Feedback you can trace. Assumptions you can challenge.</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
