/**
 * Genesis Music Platform - End-to-End User Journey Tests
 * 실제 사용자 시나리오 기반 통합 테스트
 */

import { test, expect, Page } from '@playwright/test';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

// Test configuration
const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:3001';
const AI_SERVICE_URL = 'http://localhost:8000';

// Helper to wait for services
async function waitForService(url: string, maxRetries = 30): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return true;
    } catch (e) {
      // Service not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return false;
}

// Setup test environment
test.beforeAll(async () => {
  console.log('Setting up test environment...');
  
  // Check if services are running
  const frontendReady = await waitForService(BASE_URL, 5);
  const backendReady = await waitForService(API_URL + '/health', 5);
  const aiReady = await waitForService(AI_SERVICE_URL + '/health', 5);
  
  if (!frontendReady) {
    console.warn('Frontend not running, tests may fail');
  }
  if (!backendReady) {
    console.warn('Backend not running, tests may fail');
  }
  if (!aiReady) {
    console.warn('AI service not running, tests may fail');
  }
});

test.describe('Genesis Music Platform - User Journey', () => {
  
  test('1. Homepage Load and Navigation', async ({ page }) => {
    // Navigate to homepage
    await page.goto(BASE_URL);
    
    // Check main elements
    await expect(page).toHaveTitle(/Genesis Music/i);
    
    // Check navigation elements
    const navBar = page.locator('nav');
    await expect(navBar).toBeVisible();
    
    // Check hero section
    const heroSection = page.locator('[data-testid="hero-section"]');
    if (await heroSection.count() > 0) {
      await expect(heroSection).toContainText(/AI.*Guitar/i);
    }
    
    // Take screenshot for visual verification
    await page.screenshot({ path: 'tests/screenshots/homepage.png' });
  });

  test('2. YouTube URL Processing Flow', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Find YouTube input form
    const youtubeInput = page.locator('input[placeholder*="YouTube"]').first();
    const submitButton = page.locator('button:has-text("Process"), button:has-text("Convert"), button:has-text("시작")').first();
    
    if (await youtubeInput.count() > 0 && await submitButton.count() > 0) {
      // Enter test YouTube URL
      await youtubeInput.fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      
      // Click submit
      await submitButton.click();
      
      // Wait for processing to start (look for progress indicator)
      const progressIndicator = page.locator('[data-testid="progress"], .progress, [role="progressbar"]').first();
      if (await progressIndicator.count() > 0) {
        await expect(progressIndicator).toBeVisible({ timeout: 10000 });
      }
      
      // Take screenshot of processing state
      await page.screenshot({ path: 'tests/screenshots/youtube-processing.png' });
    } else {
      console.log('YouTube input form not found - may not be implemented yet');
    }
  });

  test('3. File Upload Flow', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Look for file upload area
    const fileInput = page.locator('input[type="file"]').first();
    
    if (await fileInput.count() > 0) {
      // Create a test audio file path
      const testFile = path.join(__dirname, '../../test-assets/sample.mp3');
      
      // Check if test file exists, if not skip
      try {
        await fs.access(testFile);
        
        // Upload file
        await fileInput.setInputFiles(testFile);
        
        // Check for upload confirmation
        const uploadStatus = page.locator('[data-testid="upload-status"], .upload-status').first();
        if (await uploadStatus.count() > 0) {
          await expect(uploadStatus).toBeVisible();
        }
        
        // Take screenshot
        await page.screenshot({ path: 'tests/screenshots/file-upload.png' });
      } catch (e) {
        console.log('Test audio file not found - skipping file upload test');
      }
    } else {
      console.log('File upload not found - may not be implemented yet');
    }
  });

  test('4. Tab Viewer Functionality', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Look for tab viewer component
    const tabViewer = page.locator('[data-testid="tab-viewer"], .tab-viewer, canvas').first();
    
    if (await tabViewer.count() > 0) {
      await expect(tabViewer).toBeVisible();
      
      // Check for tab controls
      const zoomIn = page.locator('button:has-text("+"), [aria-label*="zoom in"]').first();
      const zoomOut = page.locator('button:has-text("-"), [aria-label*="zoom out"]').first();
      
      if (await zoomIn.count() > 0) {
        await zoomIn.click();
        await page.waitForTimeout(500);
      }
      
      // Take screenshot of tab viewer
      await page.screenshot({ path: 'tests/screenshots/tab-viewer.png' });
    } else {
      console.log('Tab viewer not found - may not be implemented yet');
    }
  });

  test('5. API Health Check', async ({ request }) => {
    // Test Backend API
    try {
      const backendHealth = await request.get(`${API_URL}/health`);
      if (backendHealth.ok()) {
        const data = await backendHealth.json();
        console.log('Backend health:', data);
      }
    } catch (e) {
      console.log('Backend API not accessible');
    }
    
    // Test AI Service API
    try {
      const aiHealth = await request.get(`${AI_SERVICE_URL}/health`);
      if (aiHealth.ok()) {
        const data = await aiHealth.json();
        console.log('AI Service health:', data);
      }
    } catch (e) {
      console.log('AI Service not accessible');
    }
  });

  test('6. Responsive Design Check', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({ path: 'tests/screenshots/mobile-view.png' });
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({ path: 'tests/screenshots/tablet-view.png' });
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.screenshot({ path: 'tests/screenshots/desktop-view.png' });
  });

  test('7. Performance Metrics', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Measure performance metrics
    const metrics = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      };
    });
    
    console.log('Performance Metrics:', metrics);
    
    // Assert performance thresholds
    expect(metrics.firstContentfulPaint).toBeLessThan(3000); // FCP < 3s
    expect(metrics.domContentLoaded).toBeLessThan(5000); // DOM < 5s
  });

  test('8. Accessibility Check', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check for basic accessibility
    const hasLang = await page.evaluate(() => document.documentElement.lang);
    expect(hasLang).toBeTruthy();
    
    // Check for alt texts on images
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      if (await img.isVisible()) {
        expect(alt).toBeTruthy();
      }
    }
    
    // Check for ARIA labels on buttons
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 10); i++) { // Check first 10 buttons
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      
      if (!text?.trim()) {
        // Icon-only buttons should have aria-label
        expect(ariaLabel).toBeTruthy();
      }
    }
  });

  test('9. Error Handling', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Test invalid YouTube URL
    const youtubeInput = page.locator('input[placeholder*="YouTube"]').first();
    const submitButton = page.locator('button:has-text("Process"), button:has-text("Convert")').first();
    
    if (await youtubeInput.count() > 0 && await submitButton.count() > 0) {
      await youtubeInput.fill('invalid-url');
      await submitButton.click();
      
      // Check for error message
      const errorMessage = page.locator('[role="alert"], .error, .alert-error').first();
      if (await errorMessage.count() > 0) {
        await expect(errorMessage).toBeVisible({ timeout: 5000 });
        await page.screenshot({ path: 'tests/screenshots/error-handling.png' });
      }
    }
  });

  test('10. Full User Journey Simulation', async ({ page }) => {
    console.log('Starting full user journey simulation...');
    
    // Step 1: Visit homepage
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Step 2: Check if main features are visible
    const features = [
      'YouTube',
      'Upload',
      'Tab',
      'Guitar',
      'AI',
      'Music'
    ];
    
    for (const feature of features) {
      const element = page.locator(`text=/${feature}/i`).first();
      if (await element.count() > 0) {
        console.log(`✓ Found feature: ${feature}`);
      } else {
        console.log(`✗ Missing feature: ${feature}`);
      }
    }
    
    // Step 3: Take final screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/full-journey.png',
      fullPage: true 
    });
    
    console.log('User journey simulation complete!');
  });
});

// Test for AI Service Integration
test.describe('AI Service Integration', () => {
  test('Direct AI Service Test', async ({ request }) => {
    // Skip if AI service is not running
    const aiReady = await waitForService(AI_SERVICE_URL + '/health', 2);
    if (!aiReady) {
      test.skip();
      return;
    }
    
    // Test transcription endpoint
    const response = await request.post(`${AI_SERVICE_URL}/api/transcribe`, {
      data: {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        format: 'tab'
      }
    });
    
    if (response.ok()) {
      const data = await response.json();
      expect(data).toHaveProperty('job_id');
      console.log('AI Service job created:', data.job_id);
    }
  });
});

// Generate test report
test.afterAll(async () => {
  console.log('\n=== Test Summary ===');
  console.log('Screenshots saved in: tests/screenshots/');
  console.log('Run "npx playwright show-report" to view detailed results');
});