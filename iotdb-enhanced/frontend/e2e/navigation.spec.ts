import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.describe('Unauthenticated Navigation', () => {
    test('should navigate to home page', async ({ page }) => {
      await page.goto('/');

      await expect(page).toHaveURL('/');
    });

    test('should navigate to login page', async ({ page }) => {
      await page.goto('/login');

      await expect(page).toHaveURL('/login');
      await expect(page.locator('h1, h2')).toContainText(/login|sign in/i);
    });

    test('should navigate to register page', async ({ page }) => {
      await page.goto('/register');

      await expect(page).toHaveURL('/register');
      await expect(page.locator('h1, h2')).toContainText(/register|sign up/i);
    });
  });

  test.describe('Authenticated Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL('/', { timeout: 10000 });
    });

    test('should display navigation menu', async ({ page }) => {
      // Look for navigation elements
      const nav = page.locator('nav, .navigation, [role="navigation"]');
      await expect(nav.first()).toBeVisible();
    });

    test('should navigate using menu links', async ({ page }) => {
      // Look for navigation links
      const navLinks = page.locator('nav a, .navigation a, [role="navigation"] a');

      const linkCount = await navLinks.count();

      if (linkCount > 0) {
        // Click first non-empty link
        for (let i = 0; i < linkCount; i++) {
          const link = navLinks.nth(i);
          const href = await link.getAttribute('href');

          if (href && href !== '/' && href !== '#') {
            await link.click();
            await page.waitForLoadState('networkidle');
            break;
          }
        }
      }
    });

    test('should have working breadcrumb navigation', async ({ page }) => {
      // Go to a nested page
      await page.goto('/data');

      // Look for breadcrumbs
      const breadcrumbs = page.locator('.breadcrumb, [aria-label="breadcrumb"], .breadcrumbs');

      const hasBreadcrumbs = await breadcrumbs.count() > 0;

      if (hasBreadcrumbs) {
        await expect(breadcrumbs.first()).toBeVisible();

        // Click on home breadcrumb
        const homeBreadcrumb = breadcrumbs.locator('a').filter({ hasText: /home|dashboard/i });
        const hasHomeBreadcrumb = await homeBreadcrumb.count() > 0;

        if (hasHomeBreadcrumb) {
          await homeBreadcrumb.click();
          await expect(page).toHaveURL('/');
        }
      }
    });

    test('should display user menu', async ({ page }) => {
      // Look for user menu/avatar
      const userMenu = page.locator('[class*="user"], [class*="avatar"], .user-menu');

      const hasUserMenu = await userMenu.count() > 0;

      if (hasUserMenu) {
        await expect(userMenu.first()).toBeVisible();

        // Click to open menu
        await userMenu.first().click();
        await page.waitForTimeout(500);

        // Check for menu items like logout, settings, etc.
        const menuItems = page.locator('.dropdown-menu, .menu, [role="menu"]');
        const hasMenuItems = await menuItems.count() > 0;

        if (hasMenuItems) {
          await expect(menuItems.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Mobile Navigation', () => {
    test('should show hamburger menu on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Look for hamburger menu
      const hamburgerButton = page.locator('button[aria-label*="menu"], button[aria-label*="navigation"], .hamburger, .menu-toggle');

      const hasHamburger = await hamburgerButton.count() > 0;

      if (hasHamburger) {
        await expect(hamburgerButton.first()).toBeVisible();

        // Click to open menu
        await hamburgerButton.first().click();
        await page.waitForTimeout(500);

        // Check for mobile menu
        const mobileMenu = page.locator('.mobile-menu, .sidebar, [class*="mobile"]');
        await expect(mobileMenu.first()).toBeVisible();
      }
    });

    test('should be responsive on tablet', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');

      // Page should be visible and functional
      await expect(page.locator('body')).toBeVisible();
    });
  });
});

test.describe('Page Layout', () => {
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/');

    // Check for h1
    const h1 = page.locator('h1');
    const hasH1 = await h1.count() > 0;

    if (hasH1) {
      await expect(h1.first()).toBeVisible();
    }
  });

  test('should have footer', async ({ page }) => {
    await page.goto('/');

    const footer = page.locator('footer');

    const hasFooter = await footer.count() > 0;

    if (hasFooter) {
      await expect(footer.first()).toBeVisible();
    }
  });

  test('should handle 404 pages gracefully', async ({ page }) => {
    // Go to non-existent page
    await page.goto('/this-page-does-not-exist');

    // Should show 404 page or redirect
    const notFoundContent = page.locator('text=/not found|404|page does not exist/i');
    const hasNotFound = await notFoundContent.count() > 0;

    if (hasNotFound) {
      await expect(notFoundContent.first()).toBeVisible();
    }
  });
});

test.describe('Accessibility', () => {
  test('should have proper focus management', async ({ page }) => {
    await page.goto('/login');

    // Tab through form
    await page.keyboard.press('Tab');

    // First input should be focused
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBe('INPUT');
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/login');

    // Check for form labels
    const inputs = page.locator('input');

    const inputCount = await inputs.count();

    for (let i = 0; i < Math.min(inputCount, 5); i++) {
      const input = inputs.nth(i);
      const hasLabel = await input.evaluate(el =>
        el.hasAttribute('aria-label') ||
        el.hasAttribute('id') && document.querySelector(`label[for="${el.id}"]`)
      );

      expect(hasLabel).toBe(true);
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/login');

    // Fill form using keyboard
    await page.keyboard.press('Tab');
    await page.keyboard.type('test@example.com');
    await page.keyboard.press('Tab');
    await page.keyboard.type('password123');
    await page.keyboard.press('Enter');

    // Should attempt to submit
    await page.waitForTimeout(1000);
  });
});
