import { test, expect, Page } from '@playwright/test';
import path from 'path';

// Test configuration
const TEST_URL = 'http://localhost:5173/test/notation';
const EXCERPTS_TO_TEST = [
  { id: 'beethoven-ode-to-joy', name: 'Ode to Joy - Ludwig van Beethoven' },
  { id: 'mozart-eine-kleine', name: 'Eine kleine Nachtmusik - Wolfgang Amadeus Mozart' },
  { id: 'bach-minuet-g', name: 'Minuet in G - Johann Sebastian Bach' },
  { id: 'pachelbel-canon', name: 'Canon in D - Johann Pachelbel' },
  { id: 'beatles-yesterday', name: 'Yesterday - The Beatles' },
  { id: 'led-zeppelin-stairway', name: 'Stairway to Heaven - Led Zeppelin' },
  { id: 'smoke-on-water', name: 'Smoke on the Water - Deep Purple' },
  { id: 'hotel-california', name: 'Hotel California - Eagles' },
  { id: 'blackbird', name: 'Blackbird - The Beatles' },
  { id: 'tears-in-heaven', name: 'Tears in Heaven - Eric Clapton' }
];

test.describe('Music Notation Rendering Quality Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URL);
    await page.waitForSelector('[data-testid="notation-test-page"]');
  });

  test('페이지가 정상적으로 로드되어야 함', async ({ page }) => {
    await expect(page).toHaveTitle(/악보 렌더링 테스트/);
    await expect(page.locator('[data-testid="notation-test-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="excerpt-selector"]')).toBeVisible();
    await expect(page.locator('[data-testid="notation-container"]')).toBeVisible();
  });

  test('기본 악보 요소들이 정확히 렌더링되어야 함', async ({ page }) => {
    // Wait for initial rendering
    await page.waitForTimeout(1000);
    
    // Check for SVG element
    const svgElement = page.locator('[data-testid="notation-render"] svg');
    await expect(svgElement).toBeVisible();
    
    // Verify SVG contains musical elements
    const svgContent = await svgElement.innerHTML();
    
    // Check for essential notation elements
    expect(svgContent).toContain('path'); // Notes and stems
    expect(svgContent).toContain('rect'); // Staff lines
    expect(svgContent).toContain('g'); // Grouping elements
  });

  test('음자리표, 조표, 박자표가 올바르게 표시되어야 함', async ({ page }) => {
    // Select Beethoven's Ode to Joy (G major, 4/4 time)
    await page.selectOption('[data-testid="excerpt-selector"]', 'beethoven-ode-to-joy');
    await page.waitForTimeout(500);
    
    const svgElement = page.locator('[data-testid="notation-render"] svg');
    const svgContent = await svgElement.innerHTML();
    
    // Verify clef is rendered (treble clef shape)
    expect(svgContent).toContain('vf-clef');
    
    // Verify validation status
    await expect(page.locator('[data-testid="status-clef"]')).toContainText('✓');
    await expect(page.locator('[data-testid="status-key"]')).toContainText('✓');
    await expect(page.locator('[data-testid="status-time"]')).toContainText('✓');
  });

  test('모든 유명 곡들이 정상적으로 렌더링되어야 함', async ({ page }) => {
    for (const excerpt of EXCERPTS_TO_TEST) {
      await test.step(`Testing: ${excerpt.name}`, async () => {
        // Select the excerpt
        await page.selectOption('[data-testid="excerpt-selector"]', excerpt.id);
        await page.waitForTimeout(500);
        
        // Verify notation is rendered
        const svgElement = page.locator('[data-testid="notation-render"] svg');
        await expect(svgElement).toBeVisible();
        
        // Verify SVG has content
        const svgBounds = await svgElement.boundingBox();
        expect(svgBounds?.width).toBeGreaterThan(100);
        expect(svgBounds?.height).toBeGreaterThan(50);
        
        // Check excerpt info is displayed
        await expect(page.locator('[data-testid="excerpt-info"] h2')).toContainText(excerpt.name.split(' - ')[0]);
        
        // Take screenshot for visual verification
        await page.screenshot({
          path: path.join('test-results', 'notation', `${excerpt.id}.png`),
          fullPage: false,
          clip: await svgElement.boundingBox() || undefined
        });
      });
    }
  });

  test('기타 탭 악보가 정확히 렌더링되어야 함', async ({ page }) => {
    // Test songs with guitar tabs
    const tabSongs = ['smoke-on-water', 'stairway-to-heaven', 'blackbird'];
    
    for (const songId of tabSongs) {
      await test.step(`Testing tab for: ${songId}`, async () => {
        await page.selectOption('[data-testid="excerpt-selector"]', songId);
        await page.waitForTimeout(500);
        
        // Ensure tab is visible
        const tabContainer = page.locator('[data-testid="tab-container"]');
        await expect(tabContainer).toBeVisible();
        
        // Verify tab SVG is rendered
        const tabSvg = page.locator('[data-testid="tab-render"] svg');
        await expect(tabSvg).toBeVisible();
        
        // Verify tab has 6 lines (guitar strings)
        const tabContent = await tabSvg.innerHTML();
        const lineCount = (tabContent.match(/M\s*\d+\s*\d+\s*L/g) || []).length;
        expect(lineCount).toBeGreaterThanOrEqual(6); // At least 6 lines for strings
      });
    }
  });

  test('다양한 렌더링 품질 설정이 작동해야 함', async ({ page }) => {
    const qualities = ['low', 'medium', 'high', 'professional'];
    
    for (const quality of qualities) {
      await test.step(`Testing quality: ${quality}`, async () => {
        await page.selectOption('select#quality', quality);
        await page.waitForTimeout(500);
        
        const svgElement = page.locator('[data-testid="notation-render"] svg');
        await expect(svgElement).toBeVisible();
        
        // Take screenshot for each quality level
        await page.screenshot({
          path: path.join('test-results', 'notation', `quality-${quality}.png`),
          fullPage: false
        });
      });
    }
  });

  test('PDF 내보내기 기능이 작동해야 함', async ({ page }) => {
    // Intercept print dialog
    await page.evaluate(() => {
      window.print = () => {
        window.printCalled = true;
      };
    });
    
    await page.click('[data-testid="export-pdf"]');
    
    const printCalled = await page.evaluate(() => window.printCalled);
    expect(printCalled).toBe(true);
  });

  test('SVG 내보내기 기능이 작동해야 함', async ({ page }) => {
    // Intercept download
    const downloadPromise = page.waitForEvent('download');
    
    await page.click('[data-testid="export-svg"]');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.svg');
  });

  test('악보 간격과 정렬이 균일해야 함', async ({ page }) => {
    await page.selectOption('[data-testid="excerpt-selector"]', 'beethoven-ode-to-joy');
    await page.waitForTimeout(500);
    
    // Get all note positions
    const notePositions = await page.evaluate(() => {
      const notes = document.querySelectorAll('[data-testid="notation-render"] svg .vf-notehead');
      return Array.from(notes).map(note => {
        const rect = note.getBoundingClientRect();
        return { x: rect.x, y: rect.y };
      });
    });
    
    // Check horizontal spacing is consistent
    if (notePositions.length > 2) {
      const spacings = [];
      for (let i = 1; i < notePositions.length; i++) {
        if (Math.abs(notePositions[i].y - notePositions[i-1].y) < 5) { // Same line
          spacings.push(notePositions[i].x - notePositions[i-1].x);
        }
      }
      
      if (spacings.length > 0) {
        const avgSpacing = spacings.reduce((a, b) => a + b, 0) / spacings.length;
        spacings.forEach(spacing => {
          expect(Math.abs(spacing - avgSpacing)).toBeLessThan(avgSpacing * 0.5); // Within 50% variance
        });
      }
    }
    
    // Verify spacing validation status
    await expect(page.locator('[data-testid="status-spacing"]')).toContainText('✓');
  });

  test('빔(beam) 연결이 올바르게 렌더링되어야 함', async ({ page }) => {
    // Select a piece with eighth notes
    await page.selectOption('[data-testid="excerpt-selector"]', 'mozart-eine-kleine');
    await page.waitForTimeout(500);
    
    const svgContent = await page.locator('[data-testid="notation-render"] svg').innerHTML();
    
    // Check for beam elements
    expect(svgContent).toContain('vf-beam');
    
    // Verify beam validation status
    await expect(page.locator('[data-testid="status-beams"]')).toContainText('✓');
  });

  test('임시표(accidentals)가 정확히 표시되어야 함', async ({ page }) => {
    // Select a piece with accidentals
    await page.selectOption('[data-testid="excerpt-selector"]', 'pachelbel-canon');
    await page.waitForTimeout(500);
    
    const svgContent = await page.locator('[data-testid="notation-render"] svg').innerHTML();
    
    // Check for sharp symbols (Canon in D has F#)
    expect(svgContent.toLowerCase()).toMatch(/sharp|#|accidental/);
    
    // Verify accidentals validation status
    await expect(page.locator('[data-testid="status-accidentals"]')).toContainText('✓');
  });

  test('품질 지표가 높은 수준을 표시해야 함', async ({ page }) => {
    // Check quality indicators
    const indicators = [
      { name: '선명도', minValue: 90 },
      { name: '정확도', minValue: 95 },
      { name: '가독성', minValue: 90 },
      { name: '전문가 수준', minValue: 90 }
    ];
    
    for (const indicator of indicators) {
      const element = page.locator(`.indicator:has-text("${indicator.name}") .value`);
      const value = await element.textContent();
      const numericValue = parseInt(value?.replace('%', '') || '0');
      expect(numericValue).toBeGreaterThanOrEqual(indicator.minValue);
    }
  });

  test('반응형 디자인이 모바일에서도 작동해야 함', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto(TEST_URL);
    await page.waitForSelector('[data-testid="notation-test-page"]');
    
    // Check notation is still visible
    const svgElement = page.locator('[data-testid="notation-render"] svg');
    await expect(svgElement).toBeVisible();
    
    // Check horizontal scroll is available if needed
    const container = page.locator('[data-testid="notation-container"]');
    const containerWidth = await container.evaluate(el => el.scrollWidth);
    const viewportWidth = await container.evaluate(el => el.clientWidth);
    
    if (containerWidth > viewportWidth) {
      // Scrollable
      await expect(container).toHaveCSS('overflow-x', 'auto');
    }
  });

  test('다중 마디가 올바르게 줄바꿈되어야 함', async ({ page }) => {
    await page.selectOption('[data-testid="excerpt-selector"]', 'beethoven-ode-to-joy');
    await page.waitForTimeout(500);
    
    // Check if measures wrap correctly
    const svgElement = page.locator('[data-testid="notation-render"] svg');
    const svgBounds = await svgElement.boundingBox();
    
    // Should have multiple systems if there are many measures
    expect(svgBounds?.height).toBeGreaterThan(150); // Multiple systems should increase height
  });

  test('전체 검증 상태가 모두 성공으로 표시되어야 함', async ({ page }) => {
    const validationItems = [
      'status-clef',
      'status-key',
      'status-time',
      'status-notes',
      'status-beams',
      'status-accidentals',
      'status-spacing',
      'status-quality'
    ];
    
    for (const item of validationItems) {
      await expect(page.locator(`[data-testid="${item}"]`)).toHaveClass(/success/);
      await expect(page.locator(`[data-testid="${item}"]`)).toContainText('✓');
    }
  });
});

test.describe('Visual Regression Tests', () => {
  test('각 곡의 시각적 일관성을 확인', async ({ page }) => {
    await page.goto(TEST_URL);
    
    for (const excerpt of EXCERPTS_TO_TEST.slice(0, 3)) { // Test first 3 for speed
      await test.step(`Visual test: ${excerpt.name}`, async () => {
        await page.selectOption('[data-testid="excerpt-selector"]', excerpt.id);
        await page.waitForTimeout(1000);
        
        await expect(page.locator('[data-testid="notation-container"]')).toHaveScreenshot(
          `${excerpt.id}-notation.png`,
          { 
            maxDiffPixels: 100,
            threshold: 0.2 
          }
        );
      });
    }
  });
});

test.describe('Performance Tests', () => {
  test('악보 렌더링 성능이 적절해야 함', async ({ page }) => {
    await page.goto(TEST_URL);
    
    const startTime = Date.now();
    
    // Select a complex piece
    await page.selectOption('[data-testid="excerpt-selector"]', 'hotel-california');
    
    // Wait for rendering
    await page.waitForSelector('[data-testid="notation-render"] svg');
    
    const renderTime = Date.now() - startTime;
    
    // Should render within 2 seconds
    expect(renderTime).toBeLessThan(2000);
    
    // Check for smooth rendering (no major reflows)
    const metrics = await page.evaluate(() => performance.getEntriesByType('measure'));
    console.log('Performance metrics:', metrics);
  });
});

// Test directories will be created automatically by Playwright