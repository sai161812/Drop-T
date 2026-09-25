import React from 'react';
import { BarChart3 } from 'lucide-react';
import { EmptyState } from '../components/Common/EmptyState.js';

interface ResultsPageProps {
  onNavigateToSetup: () => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({ onNavigateToSetup }) => {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
      <EmptyState
        icon={BarChart3}
        title="No Simulation Run Available Yet"
        message="Simulated comparative results, audience breakdown, and break-even analysis will appear here after a test run."
        actionTitle="What you can do right now:"
        actionSteps={[
          'Navigate to "Set up test" to configure your domain, offering, and baseline (Option A).',
          'Select your primary comparison lever (Price, Message, Served Markets, or Creative) and configure Option B.',
          'Review the 20/20/10 panel distribution (20 intended / 20 adjacent / 10 contrasting) and audience markets.',
          'Execute the 50-profile evaluation to view persona transitions, objections, and deterministic scenarios.'
        ]}
        primaryActionLabel="Go to Set up test"
        onPrimaryAction={onNavigateToSetup}
      />
    </div>
  );
};
