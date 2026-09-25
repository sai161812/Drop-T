import React from 'react';
import { MessageSquare } from 'lucide-react';
import { EmptyState } from '../components/Common/EmptyState.js';

interface PublicFeedbackPageProps {
  onNavigateToSetup: () => void;
}

export const PublicFeedbackPage: React.FC<PublicFeedbackPageProps> = ({ onNavigateToSetup }) => {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
      <EmptyState
        icon={MessageSquare}
        title="Public Feedback Link Not Generated Yet"
        message="A shareable public validation page for real prospective buyers becomes active once your test options are finalized."
        actionTitle="How real-person validation works in DROPTEST:"
        actionSteps={[
          'Finish your offering setup and comparison lever configuration in "Set up test".',
          'Execute the simulation to generate a unique, unguessable public feedback link.',
          'Share the public link with real buyers to collect anonymous choices (A, B, neither, unsure) and qualitative reasons.',
          'Review human validation results here in a dedicated section with separate counts, never mixed with the 50 simulated profiles.'
        ]}
        primaryActionLabel="Go to Set up test"
        onPrimaryAction={onNavigateToSetup}
      />
    </div>
  );
};
