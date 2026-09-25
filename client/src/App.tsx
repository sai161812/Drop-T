import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Navbar, PageTab } from './components/Navbar.js';
import { AuthModal } from './components/Auth/AuthModal.js';
import { ExplorePage } from './pages/ExplorePage.js';
import { ProductDetailPage } from './pages/ProductDetailPage.js';
import { PublishProductPage } from './pages/PublishProductPage.js';
import { MyProductsPage } from './pages/MyProductsPage.js';
import { SetupTestPage } from './pages/SetupTestPage.js';
import { ResultsPage } from './pages/ResultsPage.js';
import { PublicFeedbackPage } from './pages/PublicFeedbackPage.js';

const MainApp: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<PageTab>('explore');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | undefined>(undefined);
  const [activeTestId, setActiveTestId] = useState<string | undefined>(() => sessionStorage.getItem('droptest_active_test') || undefined);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [standaloneFeedbackToken, setStandaloneFeedbackToken] = useState<string | null>(null);

  useEffect(() => {
    if (activeTestId) sessionStorage.setItem('droptest_active_test', activeTestId);
    else sessionStorage.removeItem('droptest_active_test');
  }, [activeTestId]);

  // Handle URL parsing on mount / popstate
  useEffect(() => {
    const handleUrlNavigation = () => {
      const pathname = window.location.pathname;

      if (pathname.startsWith('/product/')) {
        const pId = pathname.replace('/product/', '').split('/')[0];
        if (pId) {
          setSelectedProductId(pId);
          setActiveTab('product-detail');
        }
      } else if (pathname.startsWith('/feedback/')) {
        const token = pathname.replace('/feedback/', '').split('/')[0];
        if (token) {
          setStandaloneFeedbackToken(token);
        }
      } else if (pathname === '/publish') {
        setActiveTab('publish');
      } else if (pathname === '/my-products') {
        setActiveTab('my-products');
      } else if (pathname === '/lab') {
        setActiveTab('setup');
      }
    };

    handleUrlNavigation();
    window.addEventListener('popstate', handleUrlNavigation);
    return () => window.removeEventListener('popstate', handleUrlNavigation);
  }, []);

  const navigateToTab = (tab: PageTab) => {
    setActiveTab(tab);
    if (tab === 'explore') {
      window.history.pushState({}, '', '/');
      setSelectedProductId(null);
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
      window.history.pushState({}, '', '/lab');
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

  const handleOpenSyntheticLab = (productId: string) => {
    setActiveTab('setup');
    window.history.pushState({}, '', `/lab?product=${productId}`);
  };

  // If in standalone public feedback view
  if (standaloneFeedbackToken) {
    return (
      <div className="app-container" style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
        <main className="workbench-main" style={{ paddingTop: 'var(--space-6)' }}>
          <PublicFeedbackPage
            tokenOrId={standaloneFeedbackToken}
            isStandalone={true}
            onNavigateToSetup={() => {
              setStandaloneFeedbackToken(null);
              window.history.pushState({}, '', '/');
              setActiveTab('explore');
            }}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Navbar
        activeTab={activeTab}
        onTabChange={navigateToTab}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      <main className="workbench-main" style={{ minHeight: 'calc(100vh - 60px)', paddingBottom: 'var(--space-8)' }}>
        {/* Explore Feed */}
        {activeTab === 'explore' && (
          <ExplorePage
            onOpenProduct={handleOpenProduct}
            onNavigateToPublish={() => navigateToTab('publish')}
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
            onNavigateToPublish={() => { setEditingProductId(undefined); setActiveTab('publish'); }}
            onOpenSyntheticLab={handleOpenSyntheticLab}
          />
        )}

        {/* Synthetic Lab (Launch Workbench) */}
        {activeTab === 'setup' && (
          <SetupTestPage
            onNavigateToResults={() => setActiveTab('results')}
            activeTestId={activeTestId}
            onTestIdChange={setActiveTestId}
          />
        )}

        {/* Synthetic Lab Results */}
        {activeTab === 'results' && (
          <ResultsPage
            testId={activeTestId}
            onNavigateToSetup={() => setActiveTab('setup')}
          />
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
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
