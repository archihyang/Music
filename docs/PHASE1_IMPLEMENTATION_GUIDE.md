# Phase 1 Implementation Guide - Genesis Music Platform
# Foundation Development (Week 1-2)

## 📋 Overview
Phase 1은 Genesis Music 플랫폼의 기초를 구축하는 단계입니다. 마이크로서비스 아키텍처, 인증 시스템, 데이터베이스, 그리고 기본 AI 모델 통합을 구현합니다.

---

## 1. 마이크로서비스 아키텍처 설정

### 1.1 API Gateway (Kong)

#### 설치 및 설정
```bash
# Docker를 사용한 Kong 설치
docker network create kong-net

# PostgreSQL for Kong
docker run -d --name kong-database \
  --network=kong-net \
  -p 5432:5432 \
  -e "POSTGRES_USER=kong" \
  -e "POSTGRES_DB=kong" \
  -e "POSTGRES_PASSWORD=kongpass" \
  postgres:13

# Kong Migration
docker run --rm --network=kong-net \
  -e "KONG_DATABASE=postgres" \
  -e "KONG_PG_HOST=kong-database" \
  -e "KONG_PG_USER=kong" \
  -e "KONG_PG_PASSWORD=kongpass" \
  kong:3.4 kong migrations bootstrap

# Kong Gateway
docker run -d --name kong-gateway \
  --network=kong-net \
  -e "KONG_DATABASE=postgres" \
  -e "KONG_PG_HOST=kong-database" \
  -e "KONG_PG_USER=kong" \
  -e "KONG_PG_PASSWORD=kongpass" \
  -e "KONG_PROXY_ACCESS_LOG=/dev/stdout" \
  -e "KONG_ADMIN_ACCESS_LOG=/dev/stdout" \
  -e "KONG_PROXY_ERROR_LOG=/dev/stderr" \
  -e "KONG_ADMIN_ERROR_LOG=/dev/stderr" \
  -e "KONG_ADMIN_LISTEN=0.0.0.0:8001" \
  -e "KONG_ADMIN_GUI_URL=http://localhost:8002" \
  -p 8000:8000 \
  -p 8443:8443 \
  -p 8001:8001 \
  -p 8444:8444 \
  -p 8002:8002 \
  kong:3.4
```

#### Kong 설정 파일 (kong.yml)
```yaml
_format_version: "3.0"
_transform: true

services:
  - name: auth-service
    url: http://auth-service:3000
    routes:
      - name: auth-route
        paths:
          - /api/auth
        strip_path: false
        
  - name: transcription-service
    url: http://transcription-service:8000
    routes:
      - name: transcription-route
        paths:
          - /api/transcribe
        strip_path: false
        
  - name: rendering-service
    url: http://rendering-service:3001
    routes:
      - name: rendering-route
        paths:
          - /api/render
        strip_path: false

plugins:
  - name: jwt
    config:
      secret_is_base64: false
      key_claim_name: iss
      
  - name: rate-limiting
    config:
      minute: 60
      hour: 1000
      policy: local
      
  - name: cors
    config:
      origins:
        - http://localhost:5173
        - https://genesis-music.com
      methods:
        - GET
        - POST
        - PUT
        - DELETE
        - OPTIONS
      headers:
        - Accept
        - Accept-Version
        - Content-Length
        - Content-MD5
        - Content-Type
        - Date
        - X-Auth-Token
        - Authorization
      exposed_headers:
        - X-Auth-Token
      credentials: true
      max_age: 3600
```

### 1.2 서비스별 구현

#### User Service (Go/Gin)

**프로젝트 구조:**
```
backend/services/user-service/
├── cmd/
│   └── main.go
├── internal/
│   ├── handlers/
│   │   ├── auth.go
│   │   └── user.go
│   ├── models/
│   │   └── user.go
│   ├── middleware/
│   │   └── jwt.go
│   └── database/
│       └── postgres.go
├── pkg/
│   └── utils/
│       └── jwt.go
├── go.mod
└── go.sum
```

**main.go:**
```go
package main

import (
    "log"
    "user-service/internal/database"
    "user-service/internal/handlers"
    "user-service/internal/middleware"
    
    "github.com/gin-gonic/gin"
    "github.com/joho/godotenv"
)

func main() {
    // Load environment variables
    err := godotenv.Load()
    if err != nil {
        log.Println("No .env file found")
    }
    
    // Initialize database
    database.InitDB()
    
    // Setup Gin router
    r := gin.Default()
    
    // CORS middleware
    r.Use(middleware.CORSMiddleware())
    
    // Public routes
    auth := r.Group("/api/auth")
    {
        auth.POST("/register", handlers.Register)
        auth.POST("/login", handlers.Login)
        auth.POST("/refresh", handlers.RefreshToken)
    }
    
    // Protected routes
    api := r.Group("/api")
    api.Use(middleware.JWTAuthMiddleware())
    {
        api.GET("/user/profile", handlers.GetProfile)
        api.PUT("/user/profile", handlers.UpdateProfile)
        api.DELETE("/user/account", handlers.DeleteAccount)
    }
    
    // Health check
    r.GET("/health", func(c *gin.Context) {
        c.JSON(200, gin.H{"status": "healthy"})
    })
    
    // Start server
    if err := r.Run(":3000"); err != nil {
        log.Fatal("Failed to start server:", err)
    }
}
```

**JWT Implementation (pkg/utils/jwt.go):**
```go
package utils

import (
    "errors"
    "os"
    "time"
    
    "github.com/golang-jwt/jwt/v5"
)

type Claims struct {
    UserID    string `json:"user_id"`
    Email     string `json:"email"`
    Role      string `json:"role"`
    jwt.RegisteredClaims
}

func GenerateToken(userID, email, role string) (string, string, error) {
    // Access token (15 minutes)
    accessClaims := &Claims{
        UserID: userID,
        Email:  email,
        Role:   role,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
            Issuer:    "genesis-music",
        },
    }
    
    accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
    accessTokenString, err := accessToken.SignedString([]byte(os.Getenv("JWT_SECRET")))
    if err != nil {
        return "", "", err
    }
    
    // Refresh token (7 days)
    refreshClaims := &Claims{
        UserID: userID,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
            Issuer:    "genesis-music",
        },
    }
    
    refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
    refreshTokenString, err := refreshToken.SignedString([]byte(os.Getenv("REFRESH_SECRET")))
    if err != nil {
        return "", "", err
    }
    
    return accessTokenString, refreshTokenString, nil
}

func ValidateToken(tokenString string) (*Claims, error) {
    token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
        return []byte(os.Getenv("JWT_SECRET")), nil
    })
    
    if err != nil {
        return nil, err
    }
    
    if claims, ok := token.Claims.(*Claims); ok && token.Valid {
        return claims, nil
    }
    
    return nil, errors.New("invalid token")
}
```

#### Transcription Service (Python/FastAPI)

**프로젝트 구조:**
```
ai-models/src/
├── main.py
├── api/
│   ├── __init__.py
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── transcription.py
│   │   └── health.py
│   └── dependencies.py
├── services/
│   ├── __init__.py
│   ├── basic_pitch_service.py
│   ├── audio_processor.py
│   └── transcription_service.py
├── models/
│   ├── __init__.py
│   └── schemas.py
├── core/
│   ├── __init__.py
│   ├── config.py
│   └── security.py
└── requirements.txt
```

**main.py:**
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import torch
from basic_pitch import ICASSP_2022_MODEL_PATH
from basic_pitch.inference import predict

from api.routes import transcription, health
from core.config import settings

# Load model on startup
model = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global model
    # Startup
    print("Loading Basic Pitch model...")
    # Pre-load model for faster inference
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device}")
    yield
    # Shutdown
    print("Shutting down...")

app = FastAPI(
    title="Genesis Music Transcription Service",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api/health", tags=["health"])
app.include_router(transcription.router, prefix="/api/transcribe", tags=["transcription"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info"
    )
```

**services/basic_pitch_service.py:**
```python
import tempfile
import numpy as np
from pathlib import Path
from typing import Optional, Dict, Any
import librosa
from basic_pitch.inference import predict
from basic_pitch import ICASSP_2022_MODEL_PATH

class BasicPitchService:
    def __init__(self):
        self.model_path = ICASSP_2022_MODEL_PATH
        self.sample_rate = 22050
        
    async def transcribe_audio(
        self, 
        audio_path: str,
        save_midi: bool = True,
        save_notes: bool = True,
        save_model_outputs: bool = False,
        onset_threshold: float = 0.5,
        frame_threshold: float = 0.3,
        minimum_note_length: float = 58,  # in milliseconds
        minimum_frequency: Optional[float] = None,
        maximum_frequency: Optional[float] = None,
        multiple_pitch_bends: bool = False,
        melodia_trick: bool = True,
        midi_tempo: float = 120
    ) -> Dict[str, Any]:
        """
        Transcribe audio file to MIDI using Basic Pitch
        
        Args:
            audio_path: Path to audio file
            save_midi: Whether to save MIDI file
            save_notes: Whether to save note events
            save_model_outputs: Whether to save raw model outputs
            onset_threshold: Threshold for note onset detection
            frame_threshold: Threshold for note frame detection
            minimum_note_length: Minimum note duration in ms
            minimum_frequency: Minimum frequency to consider
            maximum_frequency: Maximum frequency to consider
            multiple_pitch_bends: Whether to detect multiple pitch bends
            melodia_trick: Whether to use melodia post-processing
            midi_tempo: MIDI tempo in BPM
            
        Returns:
            Dictionary containing transcription results
        """
        
        with tempfile.TemporaryDirectory() as tmpdir:
            # Predict using Basic Pitch
            model_output, midi_data, note_events = predict(
                audio_path=audio_path,
                model_or_model_path=self.model_path,
                onset_threshold=onset_threshold,
                frame_threshold=frame_threshold,
                minimum_note_length=minimum_note_length,
                minimum_frequency=minimum_frequency,
                maximum_frequency=maximum_frequency,
                multiple_pitch_bends=multiple_pitch_bends,
                melodia_trick=melodia_trick,
                midi_tempo=midi_tempo
            )
            
            result = {
                "success": True,
                "midi_data": None,
                "note_events": None,
                "model_outputs": None,
                "statistics": {
                    "total_notes": len(note_events) if note_events else 0,
                    "duration": self._get_audio_duration(audio_path),
                    "tempo": midi_tempo
                }
            }
            
            # Save MIDI if requested
            if save_midi and midi_data:
                midi_path = Path(tmpdir) / "output.mid"
                midi_data.write(str(midi_path))
                with open(midi_path, 'rb') as f:
                    result["midi_data"] = f.read()
            
            # Save note events if requested
            if save_notes and note_events:
                result["note_events"] = [
                    {
                        "start_time": float(note[0]),
                        "end_time": float(note[1]),
                        "pitch": int(note[2]),
                        "velocity": int(note[3]) if len(note) > 3 else 100,
                        "confidence": float(note[4]) if len(note) > 4 else 1.0
                    }
                    for note in note_events
                ]
            
            # Save model outputs if requested
            if save_model_outputs and model_output:
                result["model_outputs"] = {
                    "note_probabilities": model_output.get("note", None),
                    "onset_probabilities": model_output.get("onset", None),
                    "contour": model_output.get("contour", None)
                }
            
            return result
    
    def _get_audio_duration(self, audio_path: str) -> float:
        """Get audio duration in seconds"""
        y, sr = librosa.load(audio_path, sr=None)
        return len(y) / sr
```

#### Rendering Service (Node.js/Express)

**프로젝트 구조:**
```
backend/services/rendering-service/
├── src/
│   ├── index.ts
│   ├── routes/
│   │   ├── index.ts
│   │   └── render.ts
│   ├── services/
│   │   ├── vexflow.service.ts
│   │   └── pdf.service.ts
│   ├── middleware/
│   │   └── auth.ts
│   └── utils/
│       └── logger.ts
├── package.json
└── tsconfig.json
```

**src/index.ts:**
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

import renderRoutes from './routes/render';
import { logger } from './utils/logger';
import { authMiddleware } from './middleware/auth';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/render', authMiddleware, renderRoutes);

// WebSocket connection for real-time updates
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  socket.on('join-session', (sessionId) => {
    socket.join(sessionId);
    logger.info(`Client ${socket.id} joined session ${sessionId}`);
  });
  
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Export for use in rendering service
export { io };

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  logger.info(`Rendering service running on port ${PORT}`);
});
```

---

## 2. Frontend Implementation (SvelteKit)

### 2.1 프로젝트 초기화

```bash
cd frontend
npm create svelte@latest . --template=skeleton --types=typescript --prettier --eslint
npm install

# 필수 패키지 설치
npm install -D @sveltejs/adapter-node
npm install vexflow tone @auth/sveltekit @auth/core
npm install socket.io-client axios
npm install -D @types/node
```

### 2.2 프로젝트 구조

```
frontend/
├── src/
│   ├── routes/
│   │   ├── +layout.svelte
│   │   ├── +layout.server.ts
│   │   ├── +page.svelte
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   ├── +page.svelte
│   │   │   │   └── +page.server.ts
│   │   │   └── register/
│   │   │       ├── +page.svelte
│   │   │       └── +page.server.ts
│   │   ├── dashboard/
│   │   │   ├── +page.svelte
│   │   │   └── +page.server.ts
│   │   └── transcribe/
│   │       ├── +page.svelte
│   │       └── +page.server.ts
│   ├── lib/
│   │   ├── components/
│   │   │   ├── TabRenderer.svelte
│   │   │   ├── AudioPlayer.svelte
│   │   │   └── FileUpload.svelte
│   │   ├── stores/
│   │   │   ├── auth.ts
│   │   │   └── transcription.ts
│   │   └── utils/
│   │       ├── api.ts
│   │       └── vexflow.ts
│   ├── hooks.server.ts
│   └── app.d.ts
├── svelte.config.js
└── vite.config.ts
```

### 2.3 Authentication Implementation

**src/hooks.server.ts:**
```typescript
import type { Handle } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';

export const handle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get('auth-token');
  
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
      event.locals.user = {
        id: payload.user_id,
        email: payload.email,
        role: payload.role
      };
    } catch (err) {
      // Invalid token, clear it
      event.cookies.delete('auth-token', { path: '/' });
    }
  }
  
  // Protected routes
  const protectedRoutes = ['/dashboard', '/transcribe', '/profile'];
  const isProtectedRoute = protectedRoutes.some(route => 
    event.url.pathname.startsWith(route)
  );
  
  if (isProtectedRoute && !event.locals.user) {
    return Response.redirect(`${event.url.origin}/auth/login`);
  }
  
  const response = await resolve(event);
  return response;
};
```

**src/lib/stores/auth.ts:**
```typescript
import { writable, derived } from 'svelte/store';
import type { User } from '$lib/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });
  
  return {
    subscribe,
    
    setUser: (user: User | null) => {
      update(state => ({
        ...state,
        user,
        isAuthenticated: !!user,
        isLoading: false
      }));
    },
    
    login: async (email: string, password: string) => {
      update(state => ({ ...state, isLoading: true }));
      
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Login failed');
        }
        
        const data = await response.json();
        update(state => ({
          ...state,
          user: data.user,
          isAuthenticated: true,
          isLoading: false
        }));
        
        return { success: true };
      } catch (error) {
        update(state => ({ ...state, isLoading: false }));
        return { success: false, error: error.message };
      }
    },
    
    logout: async () => {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    },
    
    checkAuth: async () => {
      update(state => ({ ...state, isLoading: true }));
      
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const user = await response.json();
          update(state => ({
            ...state,
            user,
            isAuthenticated: true,
            isLoading: false
          }));
        } else {
          update(state => ({
            ...state,
            user: null,
            isAuthenticated: false,
            isLoading: false
          }));
        }
      } catch {
        update(state => ({
          ...state,
          user: null,
          isAuthenticated: false,
          isLoading: false
        }));
      }
    }
  };
}

export const auth = createAuthStore();
export const isAuthenticated = derived(auth, $auth => $auth.isAuthenticated);
export const currentUser = derived(auth, $auth => $auth.user);
```

### 2.4 VexFlow Integration

**src/lib/components/TabRenderer.svelte:**
```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { Renderer, Stave, StaveNote, Formatter, Voice, Beam } from 'vexflow';
  
  export let notes: any[] = [];
  export let width: number = 800;
  export let height: number = 200;
  
  let container: HTMLDivElement;
  let renderer: any;
  
  onMount(() => {
    initializeVexFlow();
  });
  
  function initializeVexFlow() {
    // Create renderer
    renderer = new Renderer(container, Renderer.Backends.SVG);
    renderer.resize(width, height);
    const context = renderer.getContext();
    
    // Create stave
    const stave = new Stave(10, 40, width - 20);
    stave.addClef('treble');
    stave.addTimeSignature('4/4');
    stave.setContext(context).draw();
    
    // Create notes
    const vexNotes = notes.map(note => {
      return new StaveNote({
        keys: [note.keys],
        duration: note.duration,
        auto_stem: true
      });
    });
    
    // Create voice and add notes
    const voice = new Voice({ num_beats: 4, beat_value: 4 });
    voice.addTickables(vexNotes);
    
    // Format and draw
    new Formatter().joinVoices([voice]).format([voice], width - 100);
    voice.draw(context, stave);
  }
  
  // Re-render when notes change
  $: if (notes && container) {
    container.innerHTML = '';
    initializeVexFlow();
  }
</script>

<div bind:this={container} class="tab-renderer"></div>

<style>
  .tab-renderer {
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
  }
</style>
```

---

## 3. Database Schema Implementation

### 3.1 PostgreSQL Setup

**database/migrations/001_initial_schema.sql:**
```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url VARCHAR(500),
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    subscription_tier VARCHAR(50) DEFAULT 'free',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    storage_used_mb INTEGER DEFAULT 0,
    storage_limit_mb INTEGER DEFAULT 1000,
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_subscription ON users(subscription_tier);

-- Refresh tokens table
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

-- Scores table
CREATE TABLE scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255),
    album VARCHAR(255),
    genre VARCHAR(100),
    year INTEGER,
    
    -- Transcription data
    transcription_data JSONB NOT NULL,
    midi_data BYTEA,
    musicxml_data TEXT,
    render_cache JSONB,
    
    -- Audio files
    original_audio_url VARCHAR(500),
    processed_audio_url VARCHAR(500),
    audio_duration_seconds INTEGER,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_public BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    
    -- Musical metadata
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 10),
    key_signature VARCHAR(10),
    time_signature VARCHAR(10),
    tempo INTEGER,
    tuning VARCHAR(50) DEFAULT 'standard',
    capo_position INTEGER DEFAULT 0,
    
    -- AI analysis
    style_analysis JSONB,
    technique_analysis JSONB,
    chord_progression JSONB,
    similarity_matches JSONB,
    confidence_score DECIMAL(3,2),
    
    -- Tags and categories
    tags TEXT[],
    instruments TEXT[],
    techniques TEXT[]
);

-- Create indexes for scores
CREATE INDEX idx_scores_user_id ON scores(user_id);
CREATE INDEX idx_scores_public ON scores(is_public);
CREATE INDEX idx_scores_created_at ON scores(created_at DESC);
CREATE INDEX idx_scores_artist ON scores(artist);
CREATE INDEX idx_scores_tags ON scores USING GIN(tags);
CREATE INDEX idx_scores_title_search ON scores USING GIN(to_tsvector('english', title));

-- Learning progress table
CREATE TABLE learning_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    score_id UUID REFERENCES scores(id) ON DELETE CASCADE,
    
    -- Progress tracking
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_practiced_at TIMESTAMP WITH TIME ZONE,
    total_practice_time_minutes INTEGER DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Detailed progress
    sections_completed JSONB DEFAULT '[]'::jsonb,
    sections_mastered JSONB DEFAULT '[]'::jsonb,
    problem_areas JSONB DEFAULT '[]'::jsonb,
    
    -- Performance metrics
    accuracy_percentage DECIMAL(5,2),
    timing_accuracy DECIMAL(5,2),
    technique_scores JSONB,
    
    -- User feedback
    difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5),
    enjoyment_rating INTEGER CHECK (enjoyment_rating BETWEEN 1 AND 5),
    notes TEXT,
    
    -- Goals
    target_tempo INTEGER,
    current_tempo INTEGER,
    daily_practice_goal_minutes INTEGER DEFAULT 30,
    
    UNIQUE(user_id, score_id)
);

CREATE INDEX idx_learning_progress_user ON learning_progress(user_id);
CREATE INDEX idx_learning_progress_score ON learning_progress(score_id);

-- Transcription jobs table (for async processing)
CREATE TABLE transcription_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Job details
    status VARCHAR(50) DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    
    -- Input
    input_type VARCHAR(50), -- 'file', 'youtube', 'url'
    input_url VARCHAR(500),
    input_metadata JSONB,
    
    -- Output
    result_data JSONB,
    error_message TEXT,
    
    -- Timing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Settings
    transcription_settings JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_transcription_jobs_user ON transcription_jobs(user_id);
CREATE INDEX idx_transcription_jobs_status ON transcription_jobs(status);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scores_updated_at BEFORE UPDATE ON scores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 3.2 Redis Configuration

**docker-compose.yml (Redis section):**
```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    container_name: genesis-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    networks:
      - genesis-network
      
  redis-commander:
    image: rediscommander/redis-commander:latest
    container_name: genesis-redis-commander
    environment:
      - REDIS_HOSTS=local:redis:6379
    ports:
      - "8081:8081"
    depends_on:
      - redis
    networks:
      - genesis-network

volumes:
  redis_data:

networks:
  genesis-network:
    driver: bridge
```

---

## 4. Message Queue Setup (Bull MQ)

### 4.1 Bull MQ Configuration

**backend/services/queue-service/src/queues/transcription.queue.ts:**
```typescript
import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import axios from 'axios';
import { logger } from '../utils/logger';

const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null
});

// Create queue
export const transcriptionQueue = new Queue('transcription', {
  connection,
  defaultJobOptions: {
    removeOnComplete: {
      age: 24 * 3600, // 24 hours
      count: 100
    },
    removeOnFail: {
      age: 7 * 24 * 3600 // 7 days
    },
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

// Create worker
export const transcriptionWorker = new Worker(
  'transcription',
  async (job: Job) => {
    const { userId, audioUrl, settings } = job.data;
    
    try {
      // Update job progress
      await job.updateProgress(10);
      logger.info(`Starting transcription job ${job.id} for user ${userId}`);
      
      // Call Python transcription service
      const response = await axios.post(
        `${process.env.TRANSCRIPTION_SERVICE_URL}/api/transcribe`,
        {
          audio_url: audioUrl,
          settings: settings
        },
        {
          headers: {
            'X-User-Id': userId,
            'X-Job-Id': job.id
          }
        }
      );
      
      await job.updateProgress(90);
      
      // Store result
      const result = {
        transcriptionId: response.data.id,
        midiData: response.data.midi_data,
        noteEvents: response.data.note_events,
        confidence: response.data.confidence
      };
      
      await job.updateProgress(100);
      logger.info(`Completed transcription job ${job.id}`);
      
      return result;
      
    } catch (error) {
      logger.error(`Failed transcription job ${job.id}:`, error);
      throw error;
    }
  },
  {
    connection,
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000
    }
  }
);

// Event listeners
transcriptionWorker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed successfully`);
});

transcriptionWorker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed:`, err);
});

// Add job helper
export async function addTranscriptionJob(data: {
  userId: string;
  audioUrl: string;
  settings?: any;
}) {
  const job = await transcriptionQueue.add('transcribe', data, {
    priority: data.settings?.priority || 0
  });
  
  return job;
}
```

---

## 5. Docker Compose Complete Setup

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  # PostgreSQL
  postgres:
    image: postgres:15-alpine
    container_name: genesis-postgres
    environment:
      POSTGRES_USER: genesis
      POSTGRES_PASSWORD: genesis_pass
      POSTGRES_DB: genesis_music
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/migrations:/docker-entrypoint-initdb.d
    networks:
      - genesis-network
  
  # Redis
  redis:
    image: redis:7-alpine
    container_name: genesis-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    networks:
      - genesis-network
  
  # Kong API Gateway
  kong-database:
    image: postgres:13
    container_name: genesis-kong-db
    environment:
      POSTGRES_USER: kong
      POSTGRES_DB: kong
      POSTGRES_PASSWORD: kongpass
    volumes:
      - kong_data:/var/lib/postgresql/data
    networks:
      - genesis-network
  
  kong-migration:
    image: kong:3.4
    container_name: genesis-kong-migration
    depends_on:
      - kong-database
    environment:
      KONG_DATABASE: postgres
      KONG_PG_HOST: kong-database
      KONG_PG_USER: kong
      KONG_PG_PASSWORD: kongpass
    command: kong migrations bootstrap
    networks:
      - genesis-network
  
  kong:
    image: kong:3.4
    container_name: genesis-kong
    depends_on:
      - kong-database
      - kong-migration
    environment:
      KONG_DATABASE: postgres
      KONG_PG_HOST: kong-database
      KONG_PG_USER: kong
      KONG_PG_PASSWORD: kongpass
      KONG_PROXY_ACCESS_LOG: /dev/stdout
      KONG_ADMIN_ACCESS_LOG: /dev/stdout
      KONG_PROXY_ERROR_LOG: /dev/stderr
      KONG_ADMIN_ERROR_LOG: /dev/stderr
      KONG_ADMIN_LISTEN: 0.0.0.0:8001
    ports:
      - "8000:8000"
      - "8443:8443"
      - "8001:8001"
      - "8444:8444"
    networks:
      - genesis-network
  
  # User Service (Go)
  user-service:
    build: ./backend/services/user-service
    container_name: genesis-user-service
    depends_on:
      - postgres
      - redis
    environment:
      DATABASE_URL: postgres://genesis:genesis_pass@postgres:5432/genesis_music
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      REFRESH_SECRET: ${REFRESH_SECRET}
    ports:
      - "3000:3000"
    networks:
      - genesis-network
  
  # Transcription Service (Python)
  transcription-service:
    build: ./ai-models
    container_name: genesis-transcription-service
    depends_on:
      - redis
    environment:
      REDIS_URL: redis://redis:6379
      MODEL_PATH: /app/models
    ports:
      - "8000:8000"
    volumes:
      - ./ai-models/models:/app/models
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    networks:
      - genesis-network
  
  # Rendering Service (Node.js)
  rendering-service:
    build: ./backend/services/rendering-service
    container_name: genesis-rendering-service
    depends_on:
      - postgres
      - redis
    environment:
      DATABASE_URL: postgres://genesis:genesis_pass@postgres:5432/genesis_music
      REDIS_URL: redis://redis:6379
    ports:
      - "3001:3001"
    networks:
      - genesis-network
  
  # Frontend (SvelteKit)
  frontend:
    build: ./frontend
    container_name: genesis-frontend
    depends_on:
      - kong
    environment:
      PUBLIC_API_URL: http://localhost:8000
      PUBLIC_WS_URL: ws://localhost:3001
    ports:
      - "5173:5173"
    networks:
      - genesis-network

volumes:
  postgres_data:
  redis_data:
  kong_data:

networks:
  genesis-network:
    driver: bridge
```

---

## 6. Testing & Validation

### 6.1 API Testing Script

**tests/test_api.py:**
```python
import pytest
import httpx
import asyncio
from pathlib import Path

BASE_URL = "http://localhost:8000"

@pytest.mark.asyncio
async def test_health_check():
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"

@pytest.mark.asyncio
async def test_user_registration():
    async with httpx.AsyncClient() as client:
        user_data = {
            "email": "test@example.com",
            "username": "testuser",
            "password": "Test123!@#"
        }
        response = await client.post(
            f"{BASE_URL}/api/auth/register",
            json=user_data
        )
        assert response.status_code == 201
        data = response.json()
        assert "user" in data
        assert "access_token" in data

@pytest.mark.asyncio
async def test_transcription():
    async with httpx.AsyncClient() as client:
        # First login
        login_response = await client.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@example.com", "password": "Test123!@#"}
        )
        token = login_response.json()["access_token"]
        
        # Upload audio file
        test_audio = Path("tests/fixtures/test_audio.mp3")
        with open(test_audio, "rb") as f:
            files = {"audio": ("test.mp3", f, "audio/mpeg")}
            headers = {"Authorization": f"Bearer {token}"}
            
            response = await client.post(
                f"{BASE_URL}/api/transcribe",
                files=files,
                headers=headers
            )
            
        assert response.status_code == 202
        data = response.json()
        assert "job_id" in data
        
        # Check job status
        job_id = data["job_id"]
        status_response = await client.get(
            f"{BASE_URL}/api/transcribe/status/{job_id}",
            headers=headers
        )
        assert status_response.status_code == 200
```

---

## 7. Deployment Scripts

### 7.1 Setup Script

**scripts/setup.sh:**
```bash
#!/bin/bash

echo "🚀 Setting up Genesis Music Platform - Phase 1"

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed. Aborting." >&2; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "Python 3 is required but not installed. Aborting." >&2; exit 1; }

# Create environment file
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOL
# Database
DATABASE_URL=postgres://genesis:genesis_pass@localhost:5432/genesis_music
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=$(openssl rand -hex 32)
REFRESH_SECRET=$(openssl rand -hex 32)

# API URLs
PUBLIC_API_URL=http://localhost:8000
PUBLIC_WS_URL=ws://localhost:3001

# Frontend
PUBLIC_FRONTEND_URL=http://localhost:5173

# Services
TRANSCRIPTION_SERVICE_URL=http://localhost:8000
RENDERING_SERVICE_URL=http://localhost:3001
USER_SERVICE_URL=http://localhost:3000

# Environment
NODE_ENV=development
DEBUG=true
EOL
fi

# Start Docker services
echo "Starting Docker services..."
docker-compose up -d postgres redis kong-database

# Wait for databases
echo "Waiting for databases to be ready..."
sleep 10

# Run migrations
echo "Running database migrations..."
docker-compose run --rm kong-migration

# Start remaining services
echo "Starting application services..."
docker-compose up -d

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend && npm install

# Install backend dependencies
echo "Installing backend dependencies..."
cd ../backend/services/user-service && go mod download
cd ../rendering-service && npm install
cd ../../../ai-models && pip install -r requirements.txt

echo "✅ Setup complete! Services are starting up..."
echo "Access the application at http://localhost:5173"
echo "API Gateway at http://localhost:8000"
echo "Kong Admin at http://localhost:8001"
```

---

## 8. Phase 1 Completion Checklist

### Week 1-2 Deliverables

- [ ] **Backend Infrastructure**
  - [x] Kong API Gateway configured
  - [x] PostgreSQL database with schema
  - [x] Redis cache and queue setup
  - [x] Docker Compose configuration

- [ ] **Microservices**
  - [x] User Service (Go) with JWT auth
  - [x] Transcription Service (Python/FastAPI)
  - [x] Rendering Service (Node.js)
  - [ ] Integration testing

- [ ] **Frontend**
  - [x] SvelteKit project structure
  - [x] Authentication flow
  - [x] Basic UI components
  - [x] VexFlow integration

- [ ] **AI Integration**
  - [x] Basic Pitch model setup
  - [x] Audio preprocessing pipeline
  - [ ] GPU inference configuration
  - [ ] End-to-end testing

- [ ] **DevOps**
  - [x] Docker containerization
  - [x] Development environment setup
  - [ ] CI/CD pipeline (GitHub Actions)
  - [ ] Monitoring setup

### Performance Metrics

| Metric | Target | Current |
|--------|--------|---------|
| API Response Time | < 200ms | TBD |
| Transcription Time | < 30s for 3min audio | TBD |
| Concurrent Users | 100 | TBD |
| System Uptime | 99.9% | TBD |

### Known Issues & TODOs

1. **Security**
   - [ ] Implement rate limiting in Kong
   - [ ] Add CSRF protection
   - [ ] Set up SSL certificates

2. **Performance**
   - [ ] Optimize database queries
   - [ ] Implement caching strategy
   - [ ] Add CDN for static assets

3. **Testing**
   - [ ] Unit tests for all services
   - [ ] Integration tests
   - [ ] Load testing

---

## Next Steps (Week 3-4)

1. **File Upload System**
   - S3-compatible storage (MinIO)
   - Chunked upload for large files
   - Progress tracking

2. **WebSocket Implementation**
   - Real-time transcription progress
   - Live collaboration features
   - Notification system

3. **Advanced Features**
   - Demucs integration for source separation
   - Tab generation from MIDI
   - PDF export functionality

---

## Resources & Documentation

- [Kong Documentation](https://docs.konghq.com/)
- [Basic Pitch GitHub](https://github.com/spotify/basic-pitch)
- [VexFlow Documentation](https://www.vexflow.com/docs/)
- [SvelteKit Documentation](https://kit.svelte.dev/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

---

*Document Version: 1.0*
*Last Updated: 2024*
*Phase 1 Implementation Guide - Genesis Music Platform*