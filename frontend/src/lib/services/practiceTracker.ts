// Practice Tracking Service
// 연습 세션 추적 및 분석 시스템

export interface PracticeSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // seconds
  mode: 'freeplay' | 'guided' | 'challenge' | 'recording';
  
  // 성과 메트릭
  metrics: {
    notesPlayed: number;
    correctNotes: number;
    accuracy: number;
    averagePitch: number;
    averageRhythm: number;
    consistency: number;
  };
  
  // 상세 분석
  analysis: {
    problemAreas: ProblemArea[];
    improvements: Improvement[];
    techniques: TechniqueUsage[];
    tempoProgression: TempoData[];
  };
  
  // 녹음 데이터
  recording?: {
    audioBlob: Blob;
    videoBlob?: Blob;
    metadata: RecordingMetadata;
  };
  
  // 학습 컨텐츠
  content?: {
    scoreId?: string;
    lessonId?: string;
    challengeId?: string;
    backingTrackId?: string;
  };
}

export interface ProblemArea {
  fretPosition: { string: number; fret: number };
  noteRange: { start: string; end: string };
  errorType: 'pitch' | 'rhythm' | 'timing' | 'technique';
  frequency: number;
  severity: 'low' | 'medium' | 'high';
  suggestions: string[];
}

export interface Improvement {
  area: string;
  previousScore: number;
  currentScore: number;
  percentageChange: number;
  timeToImprove: number; // minutes
}

export interface TechniqueUsage {
  technique: string;
  count: number;
  accuracy: number;
  timestamp: number[];
}

export interface TempoData {
  timestamp: number;
  bpm: number;
  stability: number;
}

export interface RecordingMetadata {
  format: string;
  sampleRate: number;
  duration: number;
  fileSize: number;
}

export interface DailyStats {
  date: Date;
  totalPracticeTime: number;
  sessionsCount: number;
  averageAccuracy: number;
  notesPlayed: number;
  techniquesLearned: string[];
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  xpReward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface SkillRadar {
  pitch: number;
  rhythm: number;
  timing: number;
  technique: number;
  speed: number;
  expression: number;
  theory: number;
  creativity: number;
}

class PracticeTracker {
  private currentSession: Partial<PracticeSession> | null = null;
  private sessionStorage: PracticeSession[] = [];
  private analyticsWorker: Worker | null = null;
  
  constructor() {
    this.initializeWorker();
    this.loadSessionHistory();
  }
  
  private initializeWorker() {
    // Web Worker for background analytics processing
    if (typeof Worker !== 'undefined') {
      // Worker will be created for heavy analytics processing
      // this.analyticsWorker = new Worker('/workers/analytics.worker.js');
    }
  }
  
  private loadSessionHistory() {
    const stored = localStorage.getItem('practice_sessions');
    if (stored) {
      this.sessionStorage = JSON.parse(stored);
    }
  }
  
  // 세션 시작
  startSession(mode: PracticeSession['mode'], contentId?: string): string {
    const sessionId = this.generateSessionId();
    
    this.currentSession = {
      id: sessionId,
      userId: this.getCurrentUserId(),
      startTime: new Date(),
      mode,
      metrics: {
        notesPlayed: 0,
        correctNotes: 0,
        accuracy: 0,
        averagePitch: 0,
        averageRhythm: 0,
        consistency: 0
      },
      analysis: {
        problemAreas: [],
        improvements: [],
        techniques: [],
        tempoProgression: []
      }
    };
    
    if (contentId) {
      this.currentSession.content = this.parseContentId(contentId);
    }
    
    return sessionId;
  }
  
  // 실시간 업데이트
  updateMetrics(data: {
    note?: string;
    frequency?: number;
    accuracy?: number;
    timing?: number;
    technique?: string;
  }) {
    if (!this.currentSession) return;
    
    const metrics = this.currentSession.metrics!;
    
    if (data.note) {
      metrics.notesPlayed++;
      if (data.accuracy && data.accuracy > 90) {
        metrics.correctNotes++;
      }
    }
    
    if (data.accuracy) {
      // 이동 평균 계산
      metrics.accuracy = this.calculateMovingAverage(
        metrics.accuracy,
        data.accuracy,
        metrics.notesPlayed
      );
    }
    
    if (data.technique) {
      this.trackTechnique(data.technique, data.accuracy || 0);
    }
    
    // 문제 영역 감지
    if (data.accuracy && data.accuracy < 70) {
      this.detectProblemArea(data);
    }
  }
  
  // 세션 종료
  async endSession(): Promise<PracticeSession | null> {
    if (!this.currentSession) return null;
    
    const session = {
      ...this.currentSession,
      endTime: new Date(),
      duration: this.calculateDuration()
    } as PracticeSession;
    
    // 최종 분석 실행
    session.analysis = await this.performFinalAnalysis(session);
    
    // 개선 사항 계산
    session.analysis.improvements = this.calculateImprovements(session);
    
    // 세션 저장
    this.saveSession(session);
    
    // 업적 확인
    this.checkAchievements(session);
    
    this.currentSession = null;
    
    return session;
  }
  
  // 녹음 추가
  attachRecording(audioBlob: Blob, videoBlob?: Blob) {
    if (!this.currentSession) return;
    
    this.currentSession.recording = {
      audioBlob,
      videoBlob,
      metadata: {
        format: audioBlob.type,
        sampleRate: 48000, // Default, should be detected
        duration: this.calculateDuration(),
        fileSize: audioBlob.size + (videoBlob?.size || 0)
      }
    };
  }
  
  // 문제 영역 감지
  private detectProblemArea(data: any) {
    const analysis = this.currentSession!.analysis!;
    
    // 기존 문제 영역 찾기 또는 새로 생성
    let problemArea = analysis.problemAreas.find(
      area => area.errorType === this.classifyError(data)
    );
    
    if (!problemArea) {
      problemArea = {
        fretPosition: { string: 0, fret: 0 }, // TODO: Detect from note
        noteRange: { start: data.note, end: data.note },
        errorType: this.classifyError(data),
        frequency: 1,
        severity: 'low',
        suggestions: []
      };
      analysis.problemAreas.push(problemArea);
    } else {
      problemArea.frequency++;
      if (problemArea.frequency > 5) problemArea.severity = 'medium';
      if (problemArea.frequency > 10) problemArea.severity = 'high';
    }
    
    // AI 기반 제안 생성
    problemArea.suggestions = this.generateSuggestions(problemArea);
  }
  
  // 에러 분류
  private classifyError(data: any): ProblemArea['errorType'] {
    if (data.accuracy < 70 && data.frequency) return 'pitch';
    if (data.timing && Math.abs(data.timing) > 50) return 'timing';
    if (data.technique && data.accuracy < 80) return 'technique';
    return 'rhythm';
  }
  
  // 개선 제안 생성
  private generateSuggestions(problemArea: ProblemArea): string[] {
    const suggestions: string[] = [];
    
    switch (problemArea.errorType) {
      case 'pitch':
        suggestions.push('천천히 음을 듣고 따라해보세요');
        suggestions.push('튜너를 사용하여 정확한 음을 확인하세요');
        suggestions.push('프렛을 더 세게 누르세요');
        break;
      case 'rhythm':
        suggestions.push('메트로놈과 함께 연습하세요');
        suggestions.push('템포를 낮춰서 연습하세요');
        suggestions.push('리듬 패턴을 분해해서 연습하세요');
        break;
      case 'timing':
        suggestions.push('예비 동작을 미리 준비하세요');
        suggestions.push('느린 템포부터 시작하세요');
        suggestions.push('메트로놈의 클릭에 집중하세요');
        break;
      case 'technique':
        suggestions.push('기본 자세를 확인하세요');
        suggestions.push('손가락 위치를 조정하세요');
        suggestions.push('힘을 빼고 편안하게 연주하세요');
        break;
    }
    
    return suggestions;
  }
  
  // 테크닉 추적
  private trackTechnique(technique: string, accuracy: number) {
    const analysis = this.currentSession!.analysis!;
    
    let tech = analysis.techniques.find(t => t.technique === technique);
    if (!tech) {
      tech = {
        technique,
        count: 1,
        accuracy,
        timestamp: [Date.now()]
      };
      analysis.techniques.push(tech);
    } else {
      tech.count++;
      tech.accuracy = this.calculateMovingAverage(
        tech.accuracy,
        accuracy,
        tech.count
      );
      tech.timestamp.push(Date.now());
    }
  }
  
  // 개선 사항 계산
  private calculateImprovements(session: PracticeSession): Improvement[] {
    const improvements: Improvement[] = [];
    const previousSessions = this.getPreviousSessions(5);
    
    if (previousSessions.length === 0) return improvements;
    
    // 평균 정확도 개선
    const prevAvgAccuracy = this.calculateAverageAccuracy(previousSessions);
    const currentAccuracy = session.metrics.accuracy;
    
    if (currentAccuracy > prevAvgAccuracy) {
      improvements.push({
        area: '전체 정확도',
        previousScore: prevAvgAccuracy,
        currentScore: currentAccuracy,
        percentageChange: ((currentAccuracy - prevAvgAccuracy) / prevAvgAccuracy) * 100,
        timeToImprove: session.duration / 60
      });
    }
    
    // 테크닉별 개선
    session.analysis.techniques.forEach(tech => {
      const prevTech = this.findPreviousTechnique(tech.technique, previousSessions);
      if (prevTech && tech.accuracy > prevTech.accuracy) {
        improvements.push({
          area: tech.technique,
          previousScore: prevTech.accuracy,
          currentScore: tech.accuracy,
          percentageChange: ((tech.accuracy - prevTech.accuracy) / prevTech.accuracy) * 100,
          timeToImprove: session.duration / 60
        });
      }
    });
    
    return improvements;
  }
  
  // 최종 분석
  private async performFinalAnalysis(session: PracticeSession): Promise<PracticeSession['analysis']> {
    // AI 모델을 통한 종합 분석 (Worker 사용)
    if (this.analyticsWorker) {
      return new Promise((resolve) => {
        this.analyticsWorker!.postMessage({
          type: 'analyze',
          data: session
        });
        
        this.analyticsWorker!.onmessage = (e) => {
          resolve(e.data);
        };
      });
    }
    
    // Fallback to basic analysis
    return session.analysis;
  }
  
  // 업적 확인
  private checkAchievements(session: PracticeSession) {
    const achievements: Achievement[] = [];
    
    // 첫 세션 완료
    if (this.sessionStorage.length === 0) {
      achievements.push({
        id: 'first_session',
        name: '첫 걸음',
        description: '첫 연습 세션을 완료했습니다',
        icon: '🎸',
        unlockedAt: new Date(),
        xpReward: 100,
        rarity: 'common'
      });
    }
    
    // 정확도 마스터
    if (session.metrics.accuracy >= 95) {
      achievements.push({
        id: 'accuracy_master',
        name: '정확도 마스터',
        description: '95% 이상의 정확도를 달성했습니다',
        icon: '🎯',
        unlockedAt: new Date(),
        xpReward: 500,
        rarity: 'epic'
      });
    }
    
    // 장시간 연습
    if (session.duration >= 3600) {
      achievements.push({
        id: 'marathon_practice',
        name: '마라톤 연습',
        description: '1시간 이상 연습했습니다',
        icon: '⏰',
        unlockedAt: new Date(),
        xpReward: 300,
        rarity: 'rare'
      });
    }
    
    // 업적 저장
    if (achievements.length > 0) {
      this.saveAchievements(achievements);
      this.notifyAchievements(achievements);
    }
  }
  
  // 일일 통계
  getDailyStats(date: Date = new Date()): DailyStats {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    const daySessions = this.sessionStorage.filter(
      s => s.startTime >= dayStart && s.startTime <= dayEnd
    );
    
    return {
      date,
      totalPracticeTime: daySessions.reduce((sum, s) => sum + s.duration, 0),
      sessionsCount: daySessions.length,
      averageAccuracy: this.calculateAverageAccuracy(daySessions),
      notesPlayed: daySessions.reduce((sum, s) => sum + s.metrics.notesPlayed, 0),
      techniquesLearned: this.extractUniqueTechniques(daySessions),
      achievements: this.getAchievementsByDate(date)
    };
  }
  
  // 주간 통계
  getWeeklyStats(): DailyStats[] {
    const stats: DailyStats[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      stats.push(this.getDailyStats(date));
    }
    
    return stats;
  }
  
  // 스킬 레이더 차트 데이터
  getSkillRadar(): SkillRadar {
    const recentSessions = this.getPreviousSessions(20);
    
    return {
      pitch: this.calculateSkillScore('pitch', recentSessions),
      rhythm: this.calculateSkillScore('rhythm', recentSessions),
      timing: this.calculateSkillScore('timing', recentSessions),
      technique: this.calculateSkillScore('technique', recentSessions),
      speed: this.calculateSkillScore('speed', recentSessions),
      expression: this.calculateSkillScore('expression', recentSessions),
      theory: this.calculateSkillScore('theory', recentSessions),
      creativity: this.calculateSkillScore('creativity', recentSessions)
    };
  }
  
  // 진행률 예측
  predictProgress(targetSkill: keyof SkillRadar, targetLevel: number): {
    estimatedSessions: number;
    estimatedDays: number;
    recommendedPractice: string[];
  } {
    const currentLevel = this.getSkillRadar()[targetSkill];
    const averageImprovement = this.calculateAverageImprovement(targetSkill);
    
    const sessionsNeeded = Math.ceil((targetLevel - currentLevel) / averageImprovement);
    const averageSessionsPerDay = this.getAverageSessionsPerDay();
    const daysNeeded = Math.ceil(sessionsNeeded / averageSessionsPerDay);
    
    return {
      estimatedSessions: sessionsNeeded,
      estimatedDays: daysNeeded,
      recommendedPractice: this.getRecommendedPractice(targetSkill)
    };
  }
  
  // Helper functions
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private getCurrentUserId(): string {
    // TODO: Get from auth service
    return 'user_default';
  }
  
  private parseContentId(contentId: string): PracticeSession['content'] {
    // Parse content ID to determine type
    return {
      scoreId: contentId
    };
  }
  
  private calculateDuration(): number {
    if (!this.currentSession?.startTime) return 0;
    return Math.floor((Date.now() - this.currentSession.startTime.getTime()) / 1000);
  }
  
  private calculateMovingAverage(current: number, newValue: number, count: number): number {
    return (current * (count - 1) + newValue) / count;
  }
  
  private getPreviousSessions(count: number): PracticeSession[] {
    return this.sessionStorage
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, count);
  }
  
  private calculateAverageAccuracy(sessions: PracticeSession[]): number {
    if (sessions.length === 0) return 0;
    const sum = sessions.reduce((acc, s) => acc + s.metrics.accuracy, 0);
    return sum / sessions.length;
  }
  
  private findPreviousTechnique(technique: string, sessions: PracticeSession[]) {
    for (const session of sessions) {
      const tech = session.analysis.techniques.find(t => t.technique === technique);
      if (tech) return tech;
    }
    return null;
  }
  
  private extractUniqueTechniques(sessions: PracticeSession[]): string[] {
    const techniques = new Set<string>();
    sessions.forEach(session => {
      session.analysis.techniques.forEach(tech => {
        techniques.add(tech.technique);
      });
    });
    return Array.from(techniques);
  }
  
  private getAchievementsByDate(date: Date): Achievement[] {
    // TODO: Implement achievement storage
    return [];
  }
  
  private calculateSkillScore(skill: string, sessions: PracticeSession[]): number {
    // Calculate skill score based on session performance
    // This is a simplified implementation
    switch (skill) {
      case 'pitch':
        return sessions.reduce((sum, s) => sum + s.metrics.averagePitch, 0) / sessions.length;
      case 'rhythm':
        return sessions.reduce((sum, s) => sum + s.metrics.averageRhythm, 0) / sessions.length;
      case 'timing':
        return sessions.reduce((sum, s) => sum + s.metrics.consistency, 0) / sessions.length;
      default:
        return sessions.reduce((sum, s) => sum + s.metrics.accuracy, 0) / sessions.length;
    }
  }
  
  private calculateAverageImprovement(skill: string): number {
    // Calculate average improvement per session
    // Simplified implementation
    return 2.5; // 2.5% improvement per session average
  }
  
  private getAverageSessionsPerDay(): number {
    const days = 7;
    const recentSessions = this.getPreviousSessions(30);
    return recentSessions.length / days;
  }
  
  private getRecommendedPractice(skill: string): string[] {
    const recommendations: { [key: string]: string[] } = {
      pitch: [
        '음정 훈련 앱 사용',
        '튜너와 함께 연습',
        '슬로우 템포로 멜로디 연습'
      ],
      rhythm: [
        '메트로놈 연습',
        '리듬 패턴 분해 연습',
        '드럼 트랙과 함께 연주'
      ],
      timing: [
        '클릭 트랙과 동기화',
        '녹음 후 분석',
        '점진적 템포 증가'
      ],
      technique: [
        '기본 운지 연습',
        '스케일 패턴 반복',
        '느린 템포로 정확도 향상'
      ]
    };
    
    return recommendations[skill] || ['꾸준한 연습', '기초 강화', '전문가 피드백'];
  }
  
  private saveSession(session: PracticeSession) {
    this.sessionStorage.push(session);
    localStorage.setItem('practice_sessions', JSON.stringify(this.sessionStorage));
    
    // Send to backend
    this.syncWithBackend(session);
  }
  
  private async syncWithBackend(session: PracticeSession) {
    try {
      const response = await fetch('/api/practice/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(session)
      });
      
      if (!response.ok) {
        console.error('Failed to sync session with backend');
      }
    } catch (error) {
      console.error('Error syncing session:', error);
    }
  }
  
  private saveAchievements(achievements: Achievement[]) {
    const stored = localStorage.getItem('achievements') || '[]';
    const existing = JSON.parse(stored);
    const updated = [...existing, ...achievements];
    localStorage.setItem('achievements', JSON.stringify(updated));
  }
  
  private notifyAchievements(achievements: Achievement[]) {
    // Dispatch custom event for UI notification
    window.dispatchEvent(new CustomEvent('achievements-unlocked', {
      detail: achievements
    }));
  }
}

// Export singleton instance
export const practiceTracker = new PracticeTracker();

// Export for use in components
export default practiceTracker;