#!/bin/bash
# Genesis Music 프로젝트 초기 설정 스크립트

echo "🎸 Genesis Music 프로젝트 초기화 시작..."

# Git 초기화
if [ ! -d ".git" ]; then
    git init
    echo "✓ Git 저장소 초기화 완료"
fi

# .gitignore 생성
cat > .gitignore << EOL
# Dependencies
node_modules/
*.pyc
__pycache__/
.venv/
venv/

# Build outputs
dist/
build/
*.egg-info/

# Environment files
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Testing
coverage/
.coverage
htmlcov/
.pytest_cache/

# Temporary files
*.tmp
*.temp
.cache/

# Model files
*.h5
*.pkl
*.pth
models/weights/

# Audio files (for development)
*.mp3
*.wav
*.flac
test_audio/

# Database
*.sqlite
*.db

# Docker
docker/certs/
EOL

echo "✓ .gitignore 파일 생성 완료"

# 환경 변수 템플릿 생성
cat > .env.example << EOL
# Application
NODE_ENV=development
PORT=3001
APP_SECRET=your-secret-key-here

# Database
DATABASE_URL=postgresql://genesis_user:genesis_pass@localhost:5432/genesis_music

# Redis
REDIS_URL=redis://localhost:6379

# AI Service
AI_SERVICE_URL=http://localhost:8000

# External APIs (optional)
YOUTUBE_API_KEY=your-youtube-api-key
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret

# Storage
STORAGE_TYPE=local
STORAGE_PATH=./uploads
# For Google Cloud Storage
# GCS_BUCKET_NAME=genesis-music-storage
# GCS_KEY_FILE=./credentials/gcs-key.json

# Frontend
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
EOL

echo "✓ 환경 변수 템플릿 생성 완료"

# VS Code 설정
mkdir -p .vscode
cat > .vscode/settings.json << EOL
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "files.exclude": {
    "**/__pycache__": true,
    "**/*.pyc": true,
    "**/node_modules": true
  },
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": false,
  "python.linting.flake8Enabled": true,
  "python.formatting.provider": "black",
  "[python]": {
    "editor.formatOnSave": true
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[svelte]": {
    "editor.defaultFormatter": "svelte.svelte-vscode"
  }
}
EOL

echo "✓ VS Code 설정 완료"

# Frontend 추가 설정
cd frontend

# Svelte 설정
cat > svelte.config.js << EOL
import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter()
  }
};

export default config;
EOL

# Tailwind CSS 설정
cat > tailwind.config.js << EOL
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        'genesis': {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#3b82f6',
          700: '#1d4ed8',
          900: '#1e3a8a'
        }
      },
      fontFamily: {
        'music': ['Bravura', 'serif']
      }
    },
  },
  plugins: [],
}
EOL

# PostCSS 설정
cat > postcss.config.js << EOL
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOL

# TypeScript 설정
cat > tsconfig.json << EOL
{
  "extends": "./.svelte-kit/tsconfig.json",
  "compilerOptions": {
    "allowJs": true,
    "checkJs": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "strict": true,
    "moduleResolution": "bundler"
  }
}
EOL

cd ..

# Backend Node.js 추가 설정
cd backend

# TypeScript 설정
cat > tsconfig.json << EOL
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowJs": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOL

# Nodemon 설정
cat > nodemon.json << EOL
{
  "watch": ["src"],
  "ext": "ts,json",
  "ignore": ["src/**/*.spec.ts", "src/**/*.test.ts"],
  "exec": "ts-node --esm",
  "env": {
    "NODE_ENV": "development"
  }
}
EOL

cd ..

# AI Models 디렉토리 구조 생성
mkdir -p ai-models/src/{api,services,models,utils}
mkdir -p ai-models/tests
mkdir -p ai-models/notebooks

# Python 프로젝트 설정
cd ai-models

# Python 프로젝트 구조
cat > pyproject.toml << EOL
[tool.poetry]
name = "genesis-music-ai"
version = "0.1.0"
description = "AI service for Genesis Music platform"
authors = ["Genesis Music Developer"]

[tool.poetry.dependencies]
python = "^3.9"

[tool.black]
line-length = 88
target-version = ['py39']

[tool.isort]
profile = "black"
line_length = 88

[tool.mypy]
python_version = "3.9"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true

[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = "test_*.py"
python_functions = "test_*"
EOL

cd ..

echo "
✨ Genesis Music 프로젝트 초기화 완료!

다음 단계:
1. 의존성 설치:
   npm install
   cd frontend && npm install
   cd ../backend && npm install
   cd ../ai-models && pip install -r ../backend/requirements.txt

2. 환경 변수 설정:
   cp .env.example .env
   # .env 파일 편집

3. Docker 컨테이너 실행:
   docker-compose up -d

4. 개발 서버 시작:
   npm run dev

Happy coding! 🎸
"
