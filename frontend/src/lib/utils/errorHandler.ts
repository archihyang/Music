/**
 * 에러 처리 유틸리티
 * 전체 애플리케이션의 에러를 중앙에서 관리
 */

export interface ErrorInfo {
  message: string;
  code?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: any;
  timestamp: Date;
  stack?: string;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errors: ErrorInfo[] = [];
  private errorListeners: ((error: ErrorInfo) => void)[] = [];

  private constructor() {
    // 전역 에러 핸들러 설정
    if (typeof window !== 'undefined') {
      window.addEventListener('error', this.handleGlobalError.bind(this));
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
    }
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * 에러 로깅
   */
  logError(error: Error | string, severity: ErrorInfo['severity'] = 'medium', context?: any): void {
    const errorInfo: ErrorInfo = {
      message: typeof error === 'string' ? error : error.message,
      severity,
      context,
      timestamp: new Date(),
      stack: error instanceof Error ? error.stack : undefined,
      code: error instanceof Error && 'code' in error ? (error as any).code : undefined
    };

    this.errors.push(errorInfo);
    this.notifyListeners(errorInfo);

    // 콘솔에 출력
    if (severity === 'critical' || severity === 'high') {
      console.error('[ERROR]', errorInfo);
    } else {
      console.warn('[WARNING]', errorInfo);
    }

    // 개발 환경에서는 더 자세한 정보 출력
    if (import.meta.env.DEV) {
      console.group(`🔴 Error Details (${severity})`);
      console.log('Message:', errorInfo.message);
      console.log('Context:', errorInfo.context);
      if (errorInfo.stack) {
        console.log('Stack:', errorInfo.stack);
      }
      console.groupEnd();
    }
  }

  /**
   * 에러 알림 리스너 등록
   */
  addErrorListener(listener: (error: ErrorInfo) => void): void {
    this.errorListeners.push(listener);
  }

  /**
   * 에러 알림 리스너 제거
   */
  removeErrorListener(listener: (error: ErrorInfo) => void): void {
    this.errorListeners = this.errorListeners.filter(l => l !== listener);
  }

  /**
   * 리스너들에게 에러 알림
   */
  private notifyListeners(error: ErrorInfo): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (e) {
        console.error('Error in error listener:', e);
      }
    });
  }

  /**
   * 전역 에러 핸들러
   */
  private handleGlobalError(event: ErrorEvent): void {
    this.logError(event.error || event.message, 'high', {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  }

  /**
   * Promise rejection 핸들러
   */
  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    this.logError(
      event.reason instanceof Error ? event.reason : String(event.reason),
      'high',
      { type: 'unhandledRejection' }
    );
  }

  /**
   * 최근 에러 가져오기
   */
  getRecentErrors(limit: number = 10): ErrorInfo[] {
    return this.errors.slice(-limit);
  }

  /**
   * 에러 기록 초기화
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * 특정 심각도 이상의 에러만 가져오기
   */
  getErrorsBySeverity(minSeverity: ErrorInfo['severity']): ErrorInfo[] {
    const severityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
    const minLevel = severityOrder[minSeverity];
    
    return this.errors.filter(error => {
      return severityOrder[error.severity] >= minLevel;
    });
  }
}

/**
 * 안전한 함수 실행 래퍼
 */
export async function safeExecute<T>(
  fn: () => T | Promise<T>,
  options: {
    fallback?: T;
    errorMessage?: string;
    severity?: ErrorInfo['severity'];
    context?: any;
  } = {}
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    const errorHandler = ErrorHandler.getInstance();
    errorHandler.logError(
      error instanceof Error ? error : String(error),
      options.severity || 'medium',
      options.context
    );

    if (options.errorMessage) {
      console.error(options.errorMessage);
    }

    return options.fallback;
  }
}

/**
 * 재시도 로직을 포함한 안전한 실행
 */
export async function safeExecuteWithRetry<T>(
  fn: () => T | Promise<T>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    fallback?: T;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T | undefined> {
  const maxRetries = options.maxRetries || 3;
  const retryDelay = options.retryDelay || 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        const errorHandler = ErrorHandler.getInstance();
        errorHandler.logError(
          error instanceof Error ? error : String(error),
          'high',
          { attempts: maxRetries }
        );
        return options.fallback;
      }

      if (options.onRetry) {
        options.onRetry(attempt, error as Error);
      }

      // 지수 백오프
      await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
    }
  }

  return options.fallback;
}

/**
 * 에러 경계 컴포넌트를 위한 헬퍼
 */
export function createErrorBoundary() {
  return {
    hasError: false,
    error: null as Error | null,
    
    reset() {
      this.hasError = false;
      this.error = null;
    },
    
    catch(error: Error) {
      this.hasError = true;
      this.error = error;
      
      const errorHandler = ErrorHandler.getInstance();
      errorHandler.logError(error, 'high', {
        component: 'ErrorBoundary'
      });
    }
  };
}

// 싱글톤 인스턴스 export
export const errorHandler = ErrorHandler.getInstance();