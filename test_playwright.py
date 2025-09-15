#!/usr/bin/env python3
"""
Playwright 테스트 스크립트 - Guitar Mastery System 테스트
"""

import asyncio
import os
from playwright.async_api import async_playwright

async def test_guitar_mastery_system():
    """Guitar Mastery System UI 테스트"""
    
    async with async_playwright() as p:
        # 브라우저 시작
        browser = await p.chromium.launch(headless=False, slow_mo=2000)
        context = await browser.new_context(viewport={'width': 1280, 'height': 720})
        page = await context.new_page()
        
        try:
            # 스크린샷 저장 디렉토리 생성
            os.makedirs('screenshots', exist_ok=True)
            
            # 1. 메인 페이지 열기
            print("1. 메인 페이지 로딩 중...")
            await page.goto('file://F:/Genesis_Music/test-mastery.html')
            await page.wait_for_load_state('networkidle')
            await page.wait_for_timeout(3000)  # 3초 대기
            
            # 첫 번째 스크린샷: 메인 페이지
            await page.screenshot(path='screenshots/01_main_page.png', full_page=True)
            print("   [OK] 메인 페이지 스크린샷 저장됨")
            
            # 2. 연습 모듈 탭 클릭
            print("2. 연습 모듈 탭 클릭 중...")
            await page.click('button:has-text("연습 모듈")')
            await page.wait_for_timeout(2000)
            
            # 두 번째 스크린샷: 연습 모듈
            await page.screenshot(path='screenshots/02_practice_module.png', full_page=True)
            print("   [OK] 연습 모듈 스크린샷 저장됨")
            
            # 3. API 상태 탭 클릭
            print("3. API 상태 탭 클릭 중...")
            await page.click('button:has-text("API 상태")')
            await page.wait_for_timeout(2000)
            
            # 세 번째 스크린샷: API 상태
            await page.screenshot(path='screenshots/03_api_status.png', full_page=True)
            print("   [OK] API 상태 스크린샷 저장됨")
            
            # 4. 다시 첫 번째 탭으로 돌아가서 필터 테스트
            print("4. 필터 테스트를 위해 첫 번째 탭으로 이동...")
            await page.click('button:has-text("추천 곡")')
            await page.wait_for_timeout(1000)
            
            # 장르 필터를 Classic Rock으로 변경
            print("   - 장르를 Classic Rock으로 변경 중...")
            await page.select_option('select[onchange*="filterSongs"]', 'Classic Rock')
            await page.wait_for_timeout(1000)
            
            # 난이도를 고급으로 변경
            print("   - 난이도를 고급으로 변경 중...")
            difficulty_select = page.locator('select').nth(1)  # 두 번째 select 요소 (난이도)
            await difficulty_select.select_option('고급')
            await page.wait_for_timeout(1000)
            
            # 필터 적용 후 스크린샷
            await page.screenshot(path='screenshots/04_filtered_results.png', full_page=True)
            print("   [OK] 필터 적용 후 스크린샷 저장됨")
            
            # 페이지 내용 분석
            print("\n=== 페이지 분석 결과 ===")
            
            # 제목 확인
            title = await page.title()
            print(f"페이지 제목: {title}")
            
            # 추천 곡 수 확인
            songs = await page.locator('.song-card').count()
            print(f"표시된 곡 수: {songs}개")
            
            # API 상태 확인을 위해 다시 API 상태 탭으로 이동
            await page.click('button:has-text("API 상태")')
            await page.wait_for_timeout(1000)
            
            # Backend API 상태 확인
            backend_status = await page.locator('#backend-status').inner_text()
            print(f"Backend API 상태: {backend_status}")
            
            # AI Models API 상태 확인
            ai_status = await page.locator('#ai-status').inner_text()
            print(f"AI Models API 상태: {ai_status}")
            
            print("\n[SUCCESS] 모든 테스트가 완료되었습니다!")
            
        except Exception as e:
            print(f"[ERROR] 테스트 중 오류 발생: {e}")
            await page.screenshot(path='screenshots/error.png', full_page=True)
        
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(test_guitar_mastery_system())