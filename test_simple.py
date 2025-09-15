#!/usr/bin/env python3
"""
간단한 Playwright 테스트 - 필터 기능만 테스트
"""

import asyncio
import os
from playwright.async_api import async_playwright

async def test_filter_functionality():
    """필터 기능 테스트"""
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=1000)
        context = await browser.new_context(viewport={'width': 1280, 'height': 720})
        page = await context.new_page()
        
        try:
            os.makedirs('screenshots', exist_ok=True)
            
            print("페이지 로딩 중...")
            await page.goto('file://F:/Genesis_Music/test-mastery.html')
            await page.wait_for_load_state('networkidle')
            await page.wait_for_timeout(3000)
            
            # 첫 번째 탭이 활성화될 때까지 기다리기
            await page.wait_for_selector('.song-card', timeout=10000)
            
            # 초기 상태 스크린샷
            await page.screenshot(path='screenshots/filter_01_initial.png', full_page=True)
            print("[OK] 초기 상태 스크린샷 저장됨")
            
            # 곡 개수 확인
            initial_songs = await page.locator('.song-card').count()
            print(f"초기 곡 개수: {initial_songs}개")
            
            # 장르를 Classic Rock으로 변경
            print("장르를 Classic Rock으로 변경 중...")
            genre_select = page.locator('select').first
            await genre_select.select_option('Classic Rock')
            await page.wait_for_timeout(1000)
            
            # Classic Rock 필터 후 스크린샷
            await page.screenshot(path='screenshots/filter_02_classic_rock.png', full_page=True)
            print("[OK] Classic Rock 필터 스크린샷 저장됨")
            
            classic_rock_songs = await page.locator('.song-card').count()
            print(f"Classic Rock 곡 개수: {classic_rock_songs}개")
            
            # 난이도를 고급으로 변경
            print("난이도를 고급으로 변경 중...")
            difficulty_select = page.locator('select').nth(1)
            await difficulty_select.select_option('고급')
            await page.wait_for_timeout(1000)
            
            # 최종 필터 후 스크린샷
            await page.screenshot(path='screenshots/filter_03_advanced_classic_rock.png', full_page=True)
            print("[OK] 고급 Classic Rock 필터 스크린샷 저장됨")
            
            advanced_songs = await page.locator('.song-card').count()
            print(f"고급 Classic Rock 곡 개수: {advanced_songs}개")
            
            print("\n=== 필터 테스트 결과 ===")
            print(f"전체 곡: {initial_songs}개")
            print(f"Classic Rock: {classic_rock_songs}개")
            print(f"고급 Classic Rock: {advanced_songs}개")
            
            # 곡 제목들 확인
            song_titles = await page.locator('.song-card h4').all_text_contents()
            print("\n현재 표시된 곡들:")
            for title in song_titles:
                print(f"  - {title}")
            
            print("\n[SUCCESS] 필터 테스트 완료!")
            
        except Exception as e:
            print(f"[ERROR] 테스트 중 오류: {e}")
            await page.screenshot(path='screenshots/filter_error.png', full_page=True)
        
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(test_filter_functionality())