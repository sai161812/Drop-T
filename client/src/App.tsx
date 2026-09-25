import React, { useState } from 'react';
import { Navbar, PageTab } from './components/Navbar.js';
import { SetupTestPage } from './pages/SetupTestPage.js';
import { ResultsPage } from './pages/ResultsPage.js';
import { PublicFeedbackPage } from './pages/PublicFeedbackPage.js';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PageTab>('setup');
  const [testTitle, setTestTitle] = useState('Organic Handloom Linen Shirt');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'idle'>('idle');
  const [activeTestId, setActiveTestId] = useState<string | undefined>(undefined);

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
            onNavigateToSetup={() => setActiveTab('setup')}
          />
        )}
      </main>
    </div>
  );
};

export default App;
