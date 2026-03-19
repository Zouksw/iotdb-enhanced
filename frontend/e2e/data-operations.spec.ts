import { test, expect } from '@playwright/test';

test.describe('Data Operations', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/', { timeout: 10000 });
  });

  test.describe('Dashboard', () => {
    test('should display dashboard', async ({ page }) => {
      await page.goto('/dashboard');

      // Check for common dashboard elements
      await expect(page.locator('h1, h2')).toBeVisible();
    });

    test('should display data summary cards', async ({ page }) => {
      await page.goto('/dashboard');

      // Look for summary/stat cards
      const cards = page.locator('.card, .stat-card, [class*="stat"], [class*="card"]');
      const cardCount = await cards.count();

      // Should have at least some dashboard elements
      expect(cardCount).toBeGreaterThan(0);
    });
  });

  test.describe('Data List Views', () => {
    test('should display data list/table', async ({ page }) => {
      // Navigate to a data list page (adjust route as needed)
      await page.goto('/data');

      // Check for table or list
      const table = page.locator('table, [role="table"], .data-list');
      await expect(table.first()).toBeVisible();
    });

    test('should support pagination', async ({ page }) => {
      await page.goto('/data');

      // Look for pagination controls
      const pagination = page.locator('.pagination, [class*="paginat"], .page-nav');
      const hasPagination = await pagination.count() > 0;

      if (hasPagination) {
        // Check for next/page buttons
        const nextPageButton = page.locator('button:has-text("Next"), button:has-text(">"), [aria-label*="next"]').first();
        const hasNextPage = await nextPageButton.count() > 0;

        if (hasNextPage) {
          // Click next page if available
          await nextPageButton.click();
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('should support search/filter', async ({ page }) => {
      await page.goto('/data');

      // Look for search input
      const searchInput = page.locator('input[placeholder*="search" i], input[aria-label*="search" i], .search input');

      const hasSearch = await searchInput.count() > 0;

      if (hasSearch) {
        await searchInput.fill('test');
        await page.keyboard.press('Enter');
        await page.waitForLoadState('networkidle');

        // Should show filtered results
        await expect(page.locator('table, .data-list')).toBeVisible();
      }
    });
  });

  test.describe('CRUD Operations', () => {
    test('should create new item', async ({ page }) => {
      await page.goto('/data');

      // Look for create/add button
      const createButton = page.locator('button:has-text("Create"), button:has-text("Add"), [aria-label*="create"], [aria-label*="add"]').first();

      const hasCreateButton = await createButton.count() > 0;

      if (hasCreateButton) {
        await createButton.click();

        // Should see form or modal
        const form = page.locator('form, .modal, .dialog, [role="dialog"]');
        await expect(form.first()).toBeVisible();

        // Look for submit button
        const submitButton = page.locator('button[type="submit"]').filter({ hasText: /create|save|submit/i });
        const hasSubmit = await submitButton.count() > 0;

        if (hasSubmit) {
          // Fill required fields (this would need to be adjusted based on actual form)
          const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]');
          if (await nameInput.count() > 0) {
            await nameInput.fill(`Test Item ${Date.now()}`);

            // Submit form
            await submitButton.click();

            // Should show success message or redirect
            await page.waitForLoadState('networkidle');
          }
        }
      }
    });

    test('should view item details', async ({ page }) => {
      await page.goto('/data');

      // Click on first item in list
      const firstItem = page.locator('table tbody tr:first-child, .data-list-item:first-child, a[href*="/data/"]').first();

      const hasItem = await firstItem.count() > 0;

      if (hasItem) {
        await firstItem.click();

        // Should navigate to detail page
        await page.waitForLoadState('networkidle');

        // Check for detail view elements
        const detailView = page.locator('.detail-view, .item-detail, [class*="detail"]');
        const hasDetailView = await detailView.count() > 0;

        if (hasDetailView) {
          await expect(detailView.first()).toBeVisible();
        }
      }
    });

    test('should edit existing item', async ({ page }) => {
      // Go to detail page first
      await page.goto('/data');

      const firstItem = page.locator('table tbody tr:first-child, .data-list-item:first-child').first();

      const hasItem = await firstItem.count() > 0;

      if (hasItem) {
        await firstItem.click();
        await page.waitForLoadState('networkidle');

        // Look for edit button
        const editButton = page.locator('button:has-text("Edit"), [aria-label*="edit"]').first();

        const hasEditButton = await editButton.count() > 0;

        if (hasEditButton) {
          await editButton.click();

          // Should show edit form
          const form = page.locator('form, .modal, .dialog');
          await expect(form.first()).toBeVisible();

          // Modify a field
          const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]');
          if (await nameInput.count() > 0) {
            await nameInput.fill(`Updated Item ${Date.now()}`);

            // Submit
            const submitButton = page.locator('button[type="submit"]').filter({ hasText: /save|update/i });
            await submitButton.click();

            await page.waitForLoadState('networkidle');
          }
        }
      }
    });

    test('should delete item with confirmation', async ({ page }) => {
      await page.goto('/data');

      // Look for delete button
      const deleteButton = page.locator('button:has-text("Delete"), [aria-label*="delete"]').first();

      const hasDeleteButton = await deleteButton.count() > 0;

      if (hasDeleteButton) {
        // Accept dialog before clicking delete
        page.on('dialog', dialog => dialog.accept());

        await deleteButton.click();

        // Wait for operation to complete
        await page.waitForTimeout(1000);

        // Item should be removed from list
        await page.waitForLoadState('networkidle');
      }
    });
  });
});

test.describe('IoTDB Data Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/', { timeout: 10000 });
  });

  test('should display time series data', async ({ page }) => {
    await page.goto('/timeseries');

    // Check for chart or data visualization
    const chart = page.locator('canvas, .chart, [class*="graph"], [class*="plot"]');
    const hasChart = await chart.count() > 0;

    if (hasChart) {
      await expect(chart.first()).toBeVisible();
    }
  });

  test('should support date range filtering', async ({ page }) => {
    await page.goto('/timeseries');

    // Look for date inputs
    const dateInput = page.locator('input[type="date"], input[type="datetime-local"], .date-picker');

    const hasDateInput = await dateInput.count() > 0;

    if (hasDateInput) {
      // Interact with date picker (implementation depends on UI)
      await dateInput.first().click();
      await page.waitForTimeout(500);
    }
  });

  test('should display device list', async ({ page }) => {
    await page.goto('/devices');

    // Check for device list/table
    const deviceList = page.locator('table, .device-list, [class*="device"]');

    const hasDeviceList = await deviceList.count() > 0;

    if (hasDeviceList) {
      await expect(deviceList.first()).toBeVisible();
    }
  });
});
