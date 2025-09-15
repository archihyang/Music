# GitHub Repository Setup Guide

## 📦 GitHub 저장소 생성 및 연결

### 1. GitHub에서 새 저장소 생성

GitHub.com에 로그인 후 아래 정보로 새 저장소를 생성하세요:

- **Repository name**: `genesis-music`
- **Description**: "AI-powered guitar learning platform with professional music notation"
- **Visibility**: Public 또는 Private
- **Initialize**: README, .gitignore, License 체크 해제 (이미 로컬에 있음)

### 2. 원격 저장소 연결

저장소 생성 후 나타나는 URL을 사용하여 연결:

```bash
# HTTPS 방식 (추천)
git remote add origin https://github.com/YOUR_USERNAME/genesis-music.git

# 또는 SSH 방식 (SSH 키 설정 필요)
git remote add origin git@github.com:YOUR_USERNAME/genesis-music.git
```

### 3. 코드 푸시

```bash
# 메인 브랜치로 푸시
git push -u origin main

# 브랜치가 master인 경우
git branch -M main
git push -u origin main
```

### 4. 확인

```bash
# 원격 저장소 확인
git remote -v

# 브랜치 확인
git branch -a
```

## 🔄 GitHub Actions CI/CD 설정

`.github/workflows/` 폴더에 CI/CD 파이프라인이 준비되어 있습니다:

- `frontend-ci.yml`: Frontend 빌드 및 테스트
- `backend-ci.yml`: Backend 빌드 및 테스트
- `ai-service-ci.yml`: Python AI 서비스 테스트

푸시 후 Actions 탭에서 자동으로 실행됩니다.

## 📝 다음 단계

1. GitHub 저장소 생성 완료
2. 위 명령어로 원격 저장소 연결
3. `git push -u origin main` 실행
4. GitHub Actions 확인
5. 필요시 환경 변수 설정 (Settings → Secrets)

## 🔐 보안 참고사항

- `.env` 파일은 `.gitignore`에 포함되어 푸시되지 않음
- 민감한 정보는 GitHub Secrets 사용 권장
- API 키나 비밀번호는 절대 코드에 직접 포함하지 않음

---

**Note**: `YOUR_USERNAME`을 실제 GitHub 사용자명으로 변경하세요.