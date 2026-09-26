import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const SEEDED_PRODUCT = 'Organic Hemp Everyday Summer Tee';

async function loginDemo(page: Page, accountButton: string) {
  await page.getByRole('button', { name: /Sign In/ }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Sign In to DROPTEST' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: accountButton }).click();
  await expect(dialog).toBeHidden();
}

async function expectNoSeriousAccessibilityViolations(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const serious = result.violations.filter(item => item.impact === 'serious' || item.impact === 'critical');
  expect(serious, serious.map(item => `${item.id}: ${item.help}`).join('\n')).toEqual([]);
}

test.describe('DROPTEST browser acceptance', () => {
  test('public feed, local images, routes, modal keyboard behavior and responsive layout work', async ({ page }, testInfo) => {
    const runtimeErrors: string[] = [];
    page.on('pageerror', error => runtimeErrors.push(error.message));

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Validate your product before you commit.' })).toBeVisible();
    await page.getByRole('button', { name: 'Explore products', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Explore Startup Product Launches' })).toBeVisible();
    await expect(page.getByRole('link', { name: SEEDED_PRODUCT })).toBeVisible();

    const productImages = page.locator('article img');
    expect(await productImages.count()).toBeGreaterThanOrEqual(2);
    for (let index = 0; index < await productImages.count(); index += 1) {
      await expect(productImages.nth(index)).toBeVisible();
      expect(await productImages.nth(index).evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    }

    await page.getByRole('link', { name: SEEDED_PRODUCT }).click();
    await expect(page).toHaveURL(/\/product\//);
    await expect(page.getByRole('heading', { name: SEEDED_PRODUCT })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: SEEDED_PRODUCT })).toBeVisible();
    await page.goBack();
    await expect(page.getByRole('heading', { name: 'Explore Startup Product Launches' })).toBeVisible();
    await page.goForward();
    await expect(page.getByRole('heading', { name: SEEDED_PRODUCT })).toBeVisible();

    await page.goto('/unknown-route');
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Validate your product before you commit.' })).toBeVisible();
    await page.getByRole('button', { name: 'Explore products', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Explore Startup Product Launches' })).toBeVisible();

    const trigger = page.getByRole('button', { name: /Sign In/ }).first();
    await trigger.focus();
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Sign In to DROPTEST' });
    await expect(dialog).toBeVisible();
    await expect(page.getByRole('button', { name: 'Close' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();

    const viewportWidth = page.viewportSize()?.width || 0;
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(documentWidth).toBeLessThanOrEqual(viewportWidth + 1);
    await expectNoSeriousAccessibilityViolations(page);
    expect(runtimeErrors).toEqual([]);

    await page.screenshot({ path: testInfo.outputPath('public-feed.png'), fullPage: true });
  });

  test('shopper can save, reload and edit structured feedback without seeing founder-only details', async ({ page }) => {
    await page.goto('/');
    await loginDemo(page, 'Ananya (Shopper)');

    const existingSaveButton = page.getByRole('button', { name: new RegExp(`^(Save|Remove) ${SEEDED_PRODUCT}$`) });
    if (await existingSaveButton.getAttribute('aria-pressed') === 'true') {
      await existingSaveButton.click();
      await expect(page.getByRole('button', { name: `Save ${SEEDED_PRODUCT}` })).toHaveAttribute('aria-pressed', 'false');
    }
    const saveButton = page.getByRole('button', { name: `Save ${SEEDED_PRODUCT}` });
    await saveButton.click();
    await expect(page.getByRole('button', { name: `Remove ${SEEDED_PRODUCT}` })).toHaveAttribute('aria-pressed', 'true');
    await page.reload();
    await expect(page.getByRole('button', { name: `Remove ${SEEDED_PRODUCT}` })).toHaveAttribute('aria-pressed', 'true');

    await page.getByRole('link', { name: SEEDED_PRODUCT }).click();
    await expect(page.getByText('Founder Response Insights (Private)')).toHaveCount(0);
    await page.getByRole('button', { name: /Yes/ }).click();
    await page.getByRole('button', { name: 'Price / Value' }).click();
    await page.getByPlaceholder('Share a short specific suggestion, pricing thought, or feature requirement...').fill('Browser acceptance feedback');
    await page.getByRole('button', { name: /^(Submit|Update) Feedback$/ }).click();
    await expect(page.getByText(/feedback.*(recorded|updated)/i).first()).toBeVisible();

    await page.getByRole('button', { name: /Maybe/ }).click();
    await page.getByRole('button', { name: 'Update Feedback' }).click();
    await expect(page.getByText(/feedback response has been updated/)).toBeVisible();
    await page.reload();
    await expect(page.getByText('Your Feedback Response (Editable)')).toBeVisible();
    await expect(page.getByRole('button', { name: /Maybe/ })).toHaveClass(/btn-primary/);

    await page.getByRole('navigation').getByRole('button', { name: 'Saved' }).click();
    await expect(page).toHaveURL('/saved');
    await expect(page.getByRole('heading', { name: 'Saved Products' })).toBeVisible();
    await expect(page.getByText(SEEDED_PRODUCT)).toBeVisible();
  });

  test('sponsor submits a support proposal and the founder sees it privately', async ({ browser }) => {
    const sponsorContext = await browser.newContext();
    const sponsorPage = await sponsorContext.newPage();
    await sponsorPage.goto('/');
    await loginDemo(sponsorPage, 'Vikram (Sponsor)');
    await sponsorPage.getByRole('link', { name: SEEDED_PRODUCT }).click();
    await sponsorPage.getByRole('button', { name: /^(Offer|Update) Support$/ }).first().click();
    const dialog = sponsorPage.getByRole('dialog', { name: /^(Offer Support|Update Support Proposal)$/ });
    await expect(dialog).toBeVisible();
    await dialog.getByPlaceholder('500').fill('750.25');
    await dialog.getByPlaceholder(/Interested in early batch/).fill('Acceptance audit proposal for an initial trial batch.');
    await expectNoSeriousAccessibilityViolations(sponsorPage);
    await dialog.getByRole('button', { name: /^(Submit|Update) Proposal$/ }).click();
    await expect(sponsorPage.getByText(/Proposal sent:/).first()).toBeVisible();
    await sponsorContext.close();

    const founderContext = await browser.newContext();
    const founderPage = await founderContext.newPage();
    await founderPage.goto('/');
    await loginDemo(founderPage, 'Kavita (Apparel Startup)');
    await founderPage.getByRole('link', { name: SEEDED_PRODUCT }).click();
    await expect(founderPage.getByText('Founder Response Insights (Private)')).toBeVisible();
    await expect(founderPage.getByText('Browser acceptance feedback')).toBeVisible();
    await founderPage.getByRole('button', { name: 'My Products' }).click();
    await founderPage.getByRole('button', { name: /Support Proposals/ }).click();
    await expect(founderPage.getByText('Acceptance audit proposal for an initial trial batch.')).toBeVisible();
    await founderContext.close();
  });

  test('founder publishes, uploads, edits and opens the private lab through durable URLs', async ({ page }) => {
    const productName = `Acceptance Product ${Date.now()}`;
    await page.goto('/');
    await loginDemo(page, 'Kavita (Apparel Startup)');
    await page.getByRole('button', { name: 'Publish Product' }).click();
    await expect(page).toHaveURL('/publish');

    await page.getByLabel('Product Name *').fill(productName);
    await page.getByLabel('Category *').selectOption('other');
    await page.getByLabel('Current Stage *').selectOption('prototype');
    await page.getByLabel(/Product Summary/).fill('A complete browser-tested product with concrete specifications for acceptance validation.');
    await page.getByLabel('Intended Buyer Description *').fill('Small teams looking for a reliable browser-tested launch tool');
    await page.getByLabel(/Feedback Question/).fill('Would this product fit your launch workflow?');
    await page.getByLabel('Target Launch Price *').fill('499.50');
    await page.getByLabel('Available / Served Markets').fill('Bangalore, Mumbai');
    await page.getByLabel('Fulfillment & Delivery Mode').fill('Nationwide tracked delivery');
    await page.getByLabel(/Technical Specifications/).fill('Portable 20 cm product with recyclable materials.');

    const uploadInput = page.locator('input[type=file]');
    await uploadInput.setInputFiles('client/public/images/products/category-other-products.png');
    await expect(page.getByAltText('Upload 1')).toBeVisible();
    await page.getByLabel('Confirmed visual description for image 1').fill('A neutral product illustration used for acceptance testing');
    await expectNoSeriousAccessibilityViolations(page);
    await page.getByRole('button', { name: 'Publish Product to Feed' }).click();

    await expect(page).toHaveURL(/\/product\//);
    await expect(page.getByRole('heading', { name: productName })).toBeVisible();
    const productUrl = page.url();
    await page.reload();
    await expect(page.getByRole('heading', { name: productName })).toBeVisible();

    await page.getByRole('button', { name: 'Edit Details' }).click();
    await expect(page).toHaveURL(/\/publish\?edit=/);
    await expect(page.getByLabel('Product Name *')).toHaveValue(productName);
    await page.getByLabel(/Product Summary/).fill('Updated browser-tested product summary that survives editing and reloads.');
    await page.getByRole('button', { name: 'Update & Publish' }).click();
    await expect(page.getByText('Updated browser-tested product summary that survives editing and reloads.')).toBeVisible();

    await page.getByRole('button', { name: 'Private Synthetic Lab' }).click();
    await expect(page).toHaveURL(/\/lab\?product=/);
    await expect(page.getByRole('heading', { name: `${productName} — Synthetic Review`, exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: `${productName} — Synthetic Review`, exact: true })).toBeVisible();

    await page.goto(productUrl);
    await expect(page.getByRole('heading', { name: productName })).toBeVisible();
    await page.getByRole('button', { name: 'My Products' }).click();
    const productRow = page.getByText(productName).locator('..').locator('..');
    await expect(productRow).toBeVisible();
    await productRow.getByRole('button', { name: 'New review from current product' }).click();
    await expect(page).toHaveURL(/\/lab\?product=.*review=new/);
    await expect(page.getByText(`${productName} — AI Persona Evaluation`)).toBeVisible();
  });
});
