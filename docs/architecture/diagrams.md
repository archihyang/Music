# Genesis Music - Architecture Diagrams

## 📊 System Architecture Diagrams

### 1. High-Level System Architecture
```mermaid
graph TB
    subgraph "Users"
        U1[Web Browser]
        U2[Mobile App]
    end
    
    subgraph "Edge Layer"
        CF[CloudFlare CDN]
        WAF[Web Application Firewall]
    end
    
    subgraph "Application Layer"
        LB[Load Balancer<br/>Nginx]
        API1[API Server 1<br/>Node.js]
        API2[API Server 2<br/>Node.js]
        API3[API Server 3<br/>Node.js]
        WS[WebSocket Server<br/>Socket.io]
    end
    
    subgraph "Processing Layer"
        QUEUE[Message Queue<br/>Redis + Celery]
        AI1[AI Worker 1<br/>Python + GPU]
        AI2[AI Worker 2<br/>Python + GPU]
    end
    
    subgraph "Data Layer"
        PG[(PostgreSQL<br/>Primary)]
        PG_R[(PostgreSQL<br/>Read Replica)]
        REDIS[(Redis Cache)]
        S3[AWS S3<br/>File Storage]
    end
    
    subgraph "External Services"
        YT[YouTube API]
        SENTRY[Sentry<br/>Error Tracking]
        GA[Google Analytics]
    end
    
    U1 --> CF
    U2 --> CF
    CF --> WAF
    WAF --> LB
    LB --> API1
    LB --> API2
    LB --> API3
    API1 --> WS
    API1 --> QUEUE
    API2 --> QUEUE
    API3 --> QUEUE
    QUEUE --> AI1
    QUEUE --> AI2
    AI1 --> S3
    AI2 --> S3
    API1 --> PG
    API1 --> PG_R
    API1 --> REDIS
    AI1 --> YT
    API1 --> SENTRY
    U1 --> GA
```

### 2. Audio Processing Pipeline
```mermaid
graph LR
    subgraph "Input Stage"
        YT_URL[YouTube URL]
        AUDIO_FILE[Audio File]
    end
    
    subgraph "Download & Extraction"
        YT_DL[yt-dlp<br/>Downloader]
        FFMPEG[FFmpeg<br/>Audio Extraction]
    end
    
    subgraph "Pre-processing"
        NORMALIZE[Audio<br/>Normalization]
        CHUNK[Chunking<br/>30s segments]
        DENOISE[Noise<br/>Reduction]
    end
    
    subgraph "AI Processing"
        PITCH[Basic Pitch<br/>Note Detection]
        DEMUCS[Demucs<br/>Source Separation]
        MIDI_GEN[MIDI<br/>Generation]
    end
    
    subgraph "Post-processing"
        QUANTIZE[Note<br/>Quantization]
        CHORD[Chord<br/>Detection]
        TAB_GEN[Tab<br/>Generation]
    end
    
    subgraph "Analysis"
        THEORY[Music Theory<br/>Analysis]
        STYLE[Style<br/>Detection]
        DIFFICULTY[Difficulty<br/>Assessment]
    end
    
    subgraph "Output"
        TAB_DATA[Tab Notation<br/>JSON]
        MIDI_FILE[MIDI File]
        ANALYSIS[Theory<br/>Analysis]
    end
    
    YT_URL --> YT_DL
    AUDIO_FILE --> NORMALIZE
    YT_DL --> FFMPEG
    FFMPEG --> NORMALIZE
    NORMALIZE --> CHUNK
    CHUNK --> DENOISE
    DENOISE --> PITCH
    DENOISE --> DEMUCS
    PITCH --> MIDI_GEN
    DEMUCS --> MIDI_GEN
    MIDI_GEN --> QUANTIZE
    QUANTIZE --> CHORD
    CHORD --> TAB_GEN
    MIDI_GEN --> THEORY
    THEORY --> STYLE
    STYLE --> DIFFICULTY
    TAB_GEN --> TAB_DATA
    MIDI_GEN --> MIDI_FILE
    THEORY --> ANALYSIS
```

### 3. Real-time Communication Flow
```mermaid
sequenceDiagram
    participant C as Client
    participant WS as WebSocket Server
    participant API as API Server
    participant Q as Queue (Redis)
    participant W as AI Worker
    participant DB as Database
    
    C->>API: POST /transcribe
    API->>DB: Create job record
    API->>Q: Enqueue task
    API-->>C: Return jobId
    
    C->>WS: Connect WebSocket
    C->>WS: Subscribe to job:123
    
    W->>Q: Pull task
    W->>W: Process audio
    
    loop Every 5 seconds
        W->>Q: Update progress
        Q->>WS: Publish progress
        WS->>C: Emit progress event
    end
    
    W->>DB: Save results
    W->>Q: Mark complete
    Q->>WS: Publish completion
    WS->>C: Emit complete event
    
    C->>API: GET /transcribe/123/result
    API->>DB: Fetch results
    API-->>C: Return tab data
```

### 4. Database Schema Relationships
```mermaid
erDiagram
    USER ||--o{ TRANSCRIPTION : creates
    USER ||--o| USER_PREFERENCES : has
    USER ||--o{ SESSION : has
    TRANSCRIPTION ||--o{ JOB : has
    
    USER {
        uuid id PK
        string email UK
        string password_hash
        datetime created_at
        datetime updated_at
    }
    
    USER_PREFERENCES {
        uuid user_id PK,FK
        string guitar_tuning
        string notation_preference
        string difficulty_level
        string theme
        boolean email_notifications
    }
    
    SESSION {
        uuid id PK
        uuid user_id FK
        string token UK
        string refresh_token UK
        datetime expires_at
    }
    
    TRANSCRIPTION {
        uuid id PK
        uuid user_id FK
        enum source_type
        string source_url
        string source_filename
        enum status
        int progress
        string audio_path
        string midi_path
        jsonb tab_data
        jsonb theory_analysis
        int duration_seconds
        int tempo
        string key_signature
        string time_signature
        datetime created_at
        datetime completed_at
    }
    
    JOB {
        uuid id PK
        uuid transcription_id FK
        string celery_task_id UK
        enum status
        int progress
        string error_message
        datetime started_at
        datetime completed_at
        int processing_time_ms
    }
```

### 5. Component Architecture (Frontend)
```mermaid
graph TD
    subgraph "App Root"
        APP[App.svelte]
    end
    
    subgraph "Layout Components"
        LAYOUT[+layout.svelte]
        HEADER[Header.svelte]
        NAV[Navigation.svelte]
        FOOTER[Footer.svelte]
    end
    
    subgraph "Page Components"
        HOME[HomePage.svelte]
        TRANSCRIBE[TranscribePage.svelte]
        RESULT[ResultPage.svelte]
        PROFILE[ProfilePage.svelte]
    end
    
    subgraph "Feature Components"
        UPLOAD[AudioUploader.svelte]
        YOUTUBE[YouTubeInput.svelte]
        TAB[TabViewer.svelte]
        PLAYER[AudioPlayer.svelte]
        THEORY[TheoryAnalyzer.svelte]
        PROGRESS[ProgressTracker.svelte]
    end
    
    subgraph "Shared Components"
        BUTTON[Button.svelte]
        MODAL[Modal.svelte]
        TOAST[Toast.svelte]
        SPINNER[Spinner.svelte]
    end
    
    subgraph "Services"
        API_SVC[API Service]
        WS_SVC[WebSocket Service]
        AUDIO_SVC[Audio Service]
        AUTH_SVC[Auth Service]
    end
    
    subgraph "Stores"
        USER_STORE[User Store]
        TRANS_STORE[Transcription Store]
        SETTINGS_STORE[Settings Store]
    end
    
    APP --> LAYOUT
    LAYOUT --> HEADER
    LAYOUT --> NAV
    LAYOUT --> FOOTER
    
    APP --> HOME
    APP --> TRANSCRIBE
    APP --> RESULT
    APP --> PROFILE
    
    TRANSCRIBE --> UPLOAD
    TRANSCRIBE --> YOUTUBE
    TRANSCRIBE --> PROGRESS
    
    RESULT --> TAB
    RESULT --> PLAYER
    RESULT --> THEORY
    
    UPLOAD --> API_SVC
    PROGRESS --> WS_SVC
    PLAYER --> AUDIO_SVC
    
    API_SVC --> USER_STORE
    API_SVC --> TRANS_STORE
    WS_SVC --> TRANS_STORE
```

### 6. Deployment Pipeline
```mermaid
graph LR
    subgraph "Development"
        DEV[Local Development]
        TEST[Unit Tests]
        LINT[Linting]
    end
    
    subgraph "CI/CD"
        GH[GitHub]
        GA[GitHub Actions]
        BUILD[Build & Test]
        DOCKER[Docker Build]
    end
    
    subgraph "Staging"
        STG_K8S[Staging Kubernetes]
        STG_TEST[E2E Tests]
        STG_PERF[Performance Tests]
    end
    
    subgraph "Production"
        PROD_K8S[Production Kubernetes]
        MONITOR[Monitoring]
        BACKUP[Backup]
    end
    
    DEV --> TEST
    TEST --> LINT
    LINT --> GH
    GH --> GA
    GA --> BUILD
    BUILD --> DOCKER
    DOCKER --> STG_K8S
    STG_K8S --> STG_TEST
    STG_TEST --> STG_PERF
    STG_PERF --> PROD_K8S
    PROD_K8S --> MONITOR
    PROD_K8S --> BACKUP
```

### 7. Security Architecture
```mermaid
graph TB
    subgraph "External"
        USER[User]
        ATTACKER[Potential Attacker]
    end
    
    subgraph "Perimeter Security"
        CF_DDoS[CloudFlare<br/>DDoS Protection]
        WAF[Web Application<br/>Firewall]
        RATE[Rate Limiting]
    end
    
    subgraph "Application Security"
        TLS[TLS 1.3<br/>Encryption]
        JWT[JWT<br/>Authentication]
        RBAC[Role-Based<br/>Access Control]
        VALIDATE[Input<br/>Validation]
    end
    
    subgraph "Data Security"
        ENCRYPT[Encryption<br/>at Rest]
        HASH[Password<br/>Hashing]
        MASK[PII<br/>Masking]
        AUDIT[Audit<br/>Logging]
    end
    
    subgraph "Infrastructure Security"
        K8S_RBAC[Kubernetes<br/>RBAC]
        SECRETS[Secrets<br/>Management]
        NETWORK[Network<br/>Policies]
        SCAN[Vulnerability<br/>Scanning]
    end
    
    USER --> CF_DDoS
    ATTACKER --> CF_DDoS
    CF_DDoS --> WAF
    WAF --> RATE
    RATE --> TLS
    TLS --> JWT
    JWT --> RBAC
    RBAC --> VALIDATE
    VALIDATE --> ENCRYPT
    ENCRYPT --> HASH
    HASH --> MASK
    MASK --> AUDIT
    AUDIT --> K8S_RBAC
    K8S_RBAC --> SECRETS
    SECRETS --> NETWORK
    NETWORK --> SCAN
```

### 8. Monitoring & Observability Stack
```mermaid
graph TD
    subgraph "Applications"
        API[API Servers]
        AI[AI Workers]
        WS[WebSocket Servers]
    end
    
    subgraph "Data Collection"
        METRICS[Prometheus<br/>Metrics]
        LOGS[ELK Stack<br/>Logs]
        TRACES[Jaeger<br/>Traces]
        EVENTS[Sentry<br/>Errors]
    end
    
    subgraph "Storage"
        TSDB[Time Series DB]
        ES[Elasticsearch]
        TRACE_DB[Trace Storage]
    end
    
    subgraph "Visualization"
        GRAFANA[Grafana<br/>Dashboards]
        KIBANA[Kibana<br/>Log Analysis]
        JAEGER_UI[Jaeger UI<br/>Trace Analysis]
        SENTRY_UI[Sentry<br/>Error Dashboard]
    end
    
    subgraph "Alerting"
        ALERT_MGR[Alert Manager]
        PAGER[PagerDuty]
        SLACK[Slack]
        EMAIL[Email]
    end
    
    API --> METRICS
    API --> LOGS
    API --> TRACES
    API --> EVENTS
    
    AI --> METRICS
    AI --> LOGS
    AI --> TRACES
    AI --> EVENTS
    
    WS --> METRICS
    WS --> LOGS
    
    METRICS --> TSDB
    LOGS --> ES
    TRACES --> TRACE_DB
    
    TSDB --> GRAFANA
    ES --> KIBANA
    TRACE_DB --> JAEGER_UI
    EVENTS --> SENTRY_UI
    
    GRAFANA --> ALERT_MGR
    KIBANA --> ALERT_MGR
    SENTRY_UI --> ALERT_MGR
    
    ALERT_MGR --> PAGER
    ALERT_MGR --> SLACK
    ALERT_MGR --> EMAIL
```

## 📐 Design Patterns

### 1. Circuit Breaker Pattern
```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailTime?: Date;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}
```

### 2. Repository Pattern
```typescript
interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findAll(filter?: Partial<T>): Promise<T[]>;
  create(data: Omit<T, 'id'>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

class TranscriptionRepository implements Repository<Transcription> {
  // Implementation
}
```

### 3. Observer Pattern (WebSocket)
```typescript
class WebSocketManager {
  private subscribers = new Map<string, Set<(data: any) => void>>();
  
  subscribe(event: string, callback: (data: any) => void) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event)!.add(callback);
  }
  
  emit(event: string, data: any) {
    const callbacks = this.subscribers.get(event);
    callbacks?.forEach(callback => callback(data));
  }
}
```

## 🔄 Data Flow Examples

### Successful Transcription Flow
```
1. User uploads audio file
2. Frontend validates file (size, format)
3. File uploaded to API server
4. API creates job record in database
5. Task queued in Redis/Celery
6. Worker picks up task
7. Audio downloaded/processed
8. Basic Pitch processes audio
9. MIDI generated and processed
10. Tab notation created
11. Theory analysis performed
12. Results saved to database
13. Files uploaded to S3
14. WebSocket notifies client
15. Client fetches and displays results
```

### Error Recovery Flow
```
1. Task fails during processing
2. Error logged to Sentry
3. Worker marks job as failed
4. Retry logic checks failure count
5. If retries < max_retries:
   - Re-queue with exponential backoff
   - Increment retry counter
6. Else:
   - Mark as permanently failed
   - Send failure notification
   - Clean up partial results
7. Client notified of failure
8. User presented with options:
   - Retry with different settings
   - Contact support
   - Try different audio
```