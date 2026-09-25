import type { Product, ResearchAttempt } from '@droptest/shared';
import { ResearchRepository } from '../db/researchRepository.js';
import { ReferenceRepository } from '../db/referenceRepository.js';
import { SearchService } from '../search/searchService.js';

export async function executeResearchAttempt(productId: string, product: Product, customQuery?: string) {
  const query = customQuery?.trim() || SearchService.buildSearchQuery(product);
  const fingerprint = ResearchRepository.fingerprint(product);
  const initialProvider = SearchService.getProviderStatus().provider;
  const pending = ResearchRepository.start(productId, fingerprint, query, initialProvider);
  const result = await SearchService.searchComparableProducts(product, customQuery);
  if (result.status === 'completed') {
    ReferenceRepository.saveReferences(productId, result.references, pending.id);
  }
  const selected = ReferenceRepository.getSelectedForAttempt(productId, pending.id);
  const comparison = ReferenceRepository.buildComparisonSummary(product, selected);
  const attempt = ResearchRepository.finish(pending.id, result.status, result.provider, result.error, comparison);
  return { attempt, result, references: ReferenceRepository.listForAttempt(productId, attempt.id) };
}

export function recoverableResearchResponse(attempt: ResearchAttempt) {
  return {
    error: attempt.error_message || 'Market research could not be completed.',
    code: 'RESEARCH_FAILED',
    recoverable: true,
    choices: ['retry_research', 'continue_without_research'],
    research_attempt: attempt
  };
}
