import React, { useState, useEffect, useRef } from 'react';
import type { UserRole } from '@droptest/shared';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Navbar, PageTab } from './components/Navbar.js';
import { AuthModal } from './components/Auth/AuthModal.js';
import { ExplorePage } from './pages/ExplorePage.js';
import { SavedPage } from './pages/SavedPage.js';
import { ProductDetailPage } from './pages/ProductDetailPage.js';
import { PublishProductPage } from './pages/PublishProductPage.js';
import { MyProductsPage } from './pages/MyProductsPage.js';
import { SetupTestPage } from './pages/SetupTestPage.js';
import { ResultsPage } from './pages/ResultsPage.js';
import { PublicFeedbackPage } from './pages/PublicFeedbackPage.js';
import { LandingPage } from './pages/LandingPage.js';

const MainApp: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<PageTab>('explore');
  const [showLanding, setShowLanding] = useState(() => window.location.pathname === '/');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | undefined>(undefined);
  const [activeTestId, setActiveTestId] = useState<string | undefined>();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authDefaultRole, setAuthDefaultRole] = useState<UserRole>('startup');
  const [isHomeLandingView, setIsHomeLandingView] = useState(false);

  const handleOpenAuthModal = (role?: UserRole) => {
    if (role) {
      setAuthDefaultRole(role);
    }
    setIsAuthModalOpen(true);
  };

  const handleGoHome = () => {
    setShowLanding(true);
    setIsHomeLandingView(true);
    setSelectedProductId(null);
    setEditingProductId(undefined);
    setActiveTab('explore');
    window.history.pushState({}, '', '/');
  };
  const [standaloneFeedbackToken, setStandaloneFeedbackToken] = useState<string | null>(null);
  const [labRequest, setLabRequest] = useState<{ productId?: string; review: 'resume' | 'new' }>(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      productId: params.get('product') || params.get('product_id') || undefined,
      review: params.get('review') === 'new' ? 'new' : 'resume'
    };
  });

  const priorAccountId = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (isAuthLoading) return;
    const nextAccountId = user?.id || null;
    if (priorAccountId.current !== undefined && priorAccountId.current !== nextAccountId) {
      setActiveTestId(undefined);
      setLabRequest({ review: 'resume' });
      const path = window.location.pathname;
      if (path === '/lab' || path === '/results') window.history.replaceState({}, '', path);
      if (!user) {
        handleGoHome();
      } else {
        setIsHomeLandingView(false);
      }
    }
    priorAccountId.current = nextAccountId;
  }, [user?.id, isAuthLoading]);

  // Handle URL parsing on mount / popstate
  useEffect(() => {
    const handleUrlNavigation = () => {
      const pathname = window.location.pathname;
      setShowLanding(pathname === '/');
      if (pathname !== '/') {
        setIsHomeLandingView(false);
      }

      const params = new URLSearchParams(window.location.search);
      setStandaloneFeedbackToken(null);
      if (pathname.startsWith('/product/')) {
        const pId = decodeURIComponent(pathname.replace('/product/', '').split('/')[0]);
        if (pId) {
          setSelectedProductId(pId);
          setEditingProductId(undefined);
          setActiveTab('product-detail');
        }
      } else if (pathname.startsWith('/feedback/')) {
        const token = decodeURIComponent(pathname.replace('/feedback/', '').split('/')[0]);
        if (token) {
          setStandaloneFeedbackToken(token);
        }
      } else if (pathname === '/' || pathname === '/explore') {
        setSelectedProductId(null);
        setEditingProductId(undefined);
        setActiveTab('explore');
      } else if (pathname === '/saved') {
        setSelectedProductId(null);
        setActiveTab('saved');
      } else if (pathname === '/publish') {
        setEditingProductId(params.get('edit') || undefined);
        setActiveTab('publish');
      } else if (pathname === '/my-products') {
        setEditingProductId(undefined);
        setActiveTab('my-products');
      } else if (pathname === '/lab') {
        if (user?.role === 'user') {
          window.history.replaceState({}, '', '/explore');
          setActiveTab('explore');
          return;
        }
        setLabRequest({
          productId: params.get('product') || params.get('product_id') || undefined,
          review: params.get('review') === 'new' ? 'new' : 'resume'
        });
        setActiveTestId(params.get('test') || params.get('run') || undefined);
        setActiveTab('setup');
      } else if (pathname === '/results') {
        if (user?.role === 'user') {
          window.history.replaceState({}, '', '/explore');
          setActiveTab('explore');
          return;
        }
        setActiveTestId(params.get('test') || params.get('run') || undefined);
        setActiveTab('results');
      } else {
        window.history.replaceState({}, '', '/');
        setShowLanding(true);
        setActiveTab('explore');
        setSelectedProductId(null);
        setEditingProductId(undefined);
      }
    };

    handleUrlNavigation();
    window.addEventListener('popstate', handleUrlNavigation);
    return () => window.removeEventListener('popstate', handleUrlNavigation);
  }, [user?.role]);

  const navigateToTab = (tab: PageTab) => {
    setActiveTab(tab);
    if (tab === 'explore') {
      window.history.pushState({}, '', '/explore');
      setSelectedProductId(null);
    } else if (tab === 'saved') {
      if (!user) {
        setIsAuthModalOpen(true);
        return;
      }
      window.history.pushState({}, '', '/saved');
    } else if (tab === 'publish') {
      if (!user) {
        setIsAuthModalOpen(true);
        return;
      }
      setEditingProductId(undefined);
      window.history.pushState({}, '', '/publish');
    } else if (tab === 'my-products') {
      if (!user) {
        setIsAuthModalOpen(true);
        return;
      }
      window.history.pushState({}, '', '/my-products');
    } else if (tab === 'setup') {
      if (user?.role === 'user') {
        return;
      }
      setLabRequest({ review: 'resume' });
      const testQuery = activeTestId ? `?test=${encodeURIComponent(activeTestId)}` : '';
      window.history.pushState({}, '', `/lab${testQuery}`);
    }
  };

  const handleOpenProduct = (productId: string) => {
    setSelectedProductId(productId);
    setActiveTab('product-detail');
    window.history.pushState({}, '', `/product/${productId}`);
  };

  const handleEditProduct = (productId: string) => {
    setEditingProductId(productId);
    setActiveTab('publish');
    window.history.pushState({}, '', `/publish?edit=${productId}`);
  };

  const handleOpenSyntheticLab = (productId: string, review: 'resume' | 'new' = 'resume') => {
    setLabRequest({ productId, review });
    setActiveTab('setup');
    setActiveTestId(undefined);
    window.history.pushState({}, '', `/lab?product=${productId}${review === 'new' ? '&review=new' : ''}`);
  };

  const navigateToResults = () => {
    setActiveTab('results');
    const testQuery = activeTestId ? `?test=${encodeURIComponent(activeTestId)}` : '';
    window.history.pushState({}, '', `/results${testQuery}`);
  };

  const handleTestIdChange = (testId?: string) => {
    setActiveTestId(testId);
    if (window.location.pathname === '/lab') {
      const query = new URLSearchParams(window.location.search);
      if (testId) query.set('test', testId);
      else query.delete('test');
      const queryString = query.toString();
      window.history.replaceState({}, '', `/lab${queryString ? `?${queryString}` : ''}`);
    }
  };

  // If in standalone public feedback view
  if (standaloneFeedbackToken) {
    return (
      <div className="app-container" style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
        <main className="workbench-main" style={{ paddingTop: 'var(--space-6)' }}>
          <PublicFeedbackPage
            tokenOrId={standaloneFeedbackToken}
            isStandalone={true}
            onNavigateToSetup={() => navigateToTab('explore')}
          />
        </main>
      </div>
    );
  }

  if (!isAuthLoading && activeTab === 'explore' && ((!user && showLanding) || isHomeLandingView)) {
    return (
      <>
        <LandingPage
          onExplore={() => {
            window.history.pushState({}, '', '/explore');
            setShowLanding(false);
            setIsHomeLandingView(false);
            setActiveTab('explore');
          }}
          onSignIn={handleOpenAuthModal}
          onOpenProduct={handleOpenProduct}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          defaultRole={authDefaultRole}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="app-container" style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Navbar
        activeTab={activeTab}
        onTabChange={navigateToTab}
        onOpenAuthModal={handleOpenAuthModal}
        onGoHome={handleGoHome}
      />

      <main className="workbench-main" style={{ minHeight: 'calc(100vh - 60px)', paddingBottom: 'var(--space-8)' }}>
        {/* Explore Feed */}
        {activeTab === 'explore' && (
          <ExplorePage
            onOpenProduct={handleOpenProduct}
            onNavigateToPublish={() => navigateToTab('publish')}
            onPromptAuth={() => setIsAuthModalOpen(true)}
            onGoHome={handleGoHome}
          />
        )}

        {/* Saved Products */}
        {activeTab === 'saved' && (
          <SavedPage
            onOpenProduct={handleOpenProduct}
            onNavigateToExplore={() => navigateToTab('explore')}
            onPromptAuth={() => setIsAuthModalOpen(true)}
          />
        )}

        {/* Product Detail Page */}
        {activeTab === 'product-detail' && selectedProductId && (
          <ProductDetailPage
            productId={selectedProductId}
            onNavigateBack={() => navigateToTab('explore')}
            onEditProduct={handleEditProduct}
            onOpenSyntheticLab={handleOpenSyntheticLab}
            onPromptAuth={() => setIsAuthModalOpen(true)}
          />
        )}

        {/* Publish / Edit Product */}
        {activeTab === 'publish' && (
          <PublishProductPage
            editProductId={editingProductId}
            onNavigateBack={() => navigateToTab(user?.role === 'startup' ? 'my-products' : 'explore')}
            onPublishSuccess={(pId) => handleOpenProduct(pId)}
          />
        )}

        {/* My Products (Startup Founder Portal) */}
        {activeTab === 'my-products' && (
          <MyProductsPage
            onOpenProduct={handleOpenProduct}
            onEditProduct={handleEditProduct}
            onNavigateToPublish={() => navigateToTab('publish')}
            onOpenSyntheticLab={handleOpenSyntheticLab}
          />
        )}

        {/* Synthetic Lab (Launch Workbench) */}
        {activeTab === 'setup' && (
          <SetupTestPage
            onNavigateToResults={navigateToResults}
            activeTestId={activeTestId}
            onTestIdChange={handleTestIdChange}
            linkedProductId={labRequest.productId}
            linkedProductReview={labRequest.review}
          />
        )}

        {/* Synthetic Lab Results */}
        {activeTab === 'results' && (
          <ResultsPage
            testId={activeTestId}
            onNavigateToSetup={() => navigateToTab('setup')}
          />
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        defaultRole={authDefaultRole}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
