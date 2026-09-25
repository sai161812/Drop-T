import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { CompetitorReference, Product } from '@droptest/shared';
import { SearchService } from '../src/search/searchService.js';
import { ReferenceRepository } from '../src/db/referenceRepository.js';

const product = {
  id: 'product-sequence-4',
  name: 'Breeze Tee',
  category: 'clothing_accessories',
  summary: 'A linen summer shirt for humid weather',
  price: 899,
  currency: 'INR',
  availability_markets: ['Chennai'],
  category_data: { material: 'linen', item_type: 'shirt' }
} as Product;

describe('Sequence 4: grounded research and exact citation contracts', () => {
  it('builds the query only from entered facts', () => {
    const query = SearchService.buildSearchQuery(product);
    assert.match(query, /Breeze Tee/);
    assert.match(query, /linen/);
    assert.match(query, /Chennai/);
    assert.match(query, /899/);
    assert.doesNotMatch(query, /sustainable|artisan|India/);
  });

  it('canonicalizes tracking URLs and keeps distinct product pages on one domain', () => {
    const refs = SearchService.processSearchResults([
      { title: 'Linen Shirt One', url: 'https://shop.example.com/products/one?utm_source=x', snippet: 'Linen summer shirt designed for humid weather.' },
      { title: 'Linen Shirt One duplicate', url: 'https://shop.example.com/products/one?utm_medium=y', snippet: 'Linen summer shirt designed for humid weather.' },
      { title: 'Linen Shirt Two', url: 'https://shop.example.com/products/two', snippet: 'Another linen shirt for hot and humid climates.' },
      { title: 'Thin result', url: 'https://other.example.com/a', snippet: 'Too short' }
    ], product, 'linen shirts');
    assert.equal(refs.length, 2);
    assert.equal(refs[0].url.includes('utm_'), false);
    assert.equal(new Set(refs.map(ref => ref.url)).size, 2);
    assert.equal(new Set(refs.map(ref => ref.domain)).size, 1);
  });

  it('accepts exact aliases and full IDs but rejects prefixes, domains, and unknown aliases', () => {
    const refs = [
      { id: 'full-reference-id-001', domain: 'one.example' },
      { id: 'full-reference-id-002', domain: 'two.example' }
    ] as CompetitorReference[];
    assert.equal(ReferenceRepository.resolveSourceId('REF-2', refs), refs[1].id);
    assert.equal(ReferenceRepository.resolveSourceId('[ref-1]', refs), refs[0].id);
    assert.equal(ReferenceRepository.resolveSourceId(refs[0].id, refs), refs[0].id);
    assert.equal(ReferenceRepository.resolveSourceId('full-reference', refs), null);
    assert.equal(ReferenceRepository.resolveSourceId('one.example', refs), null);
    assert.equal(ReferenceRepository.resolveSourceId('REF-99', refs), null);
  });
});
