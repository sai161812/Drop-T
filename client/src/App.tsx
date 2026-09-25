import React, { useState, useEffect } from 'react';
import { Navbar, PageTab } from './components/Navbar.js';
import { SetupTestPage } from './pages/SetupTestPage.js';
import { ResultsPage } from './pages/ResultsPage.js';
import { PublicFeedbackPage } from './pages/PublicFeedbackPage.js';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PageTab>('setup');
  const [testTitle, setTestTitle] = useState('Organic Handloom Linen Shirt');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'idle'>('idle');
  const [activeTestId, setActiveTestId] = useState<string | undefined>(undefined);
  const [standaloneFeedbackToken, setStandaloneFeedbackToken] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is navigating directly to a public feedback page
    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const feedbackParam = searchParams.get('feedback');

    if (pathname.startsWith('/feedback/')) {
      const token = pathname.replace('/feedback/', '').split('/')[0];
      if (token) {
        setStandaloneFeedbackToken(token);
      }
    } else if (feedbackParam) {
      setStandaloneFeedbackToken(feedbackParam);
    } else if (window.location.hash.startsWith('#/feedback/')) {
      const token = window.location.hash.replace('#/feedback/', '').split('?')[0];
      if (token) {
        setStandaloneFeedbackToken(token);
      }
    }
  }, []);

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
            }}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        testTitle={testTitle}
        saveStatus={saveStatus}
      />

      <main className="workbench-main">
        {activeTab === 'setup' && (
          <SetupTestPage
            onUpdateHeaderTitle={setTestTitle}
            onNavigateToResults={() => setActiveTab('results')}
            setSaveStatus={setSaveStatus}
            activeTestId={activeTestId}
            onTestIdChange={setActiveTestId}
          />
        )}

        {activeTab === 'results' && (
          <ResultsPage
            testId={activeTestId}
            onNavigateToSetup={() => setActiveTab('setup')}
          />
        )}

        {activeTab === 'feedback' && (
          <PublicFeedbackPage
            tokenOrId={activeTestId}
            isStandalone={false}
            onNavigateToSetup={() => setActiveTab('setup')}
          />
        )}
      </main>
    </div>
  );
};

export default App;
