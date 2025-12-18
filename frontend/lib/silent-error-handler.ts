import backend from '~backend/client';
import type { ErrorSeverity, ErrorType, BrowserInfo } from '~backend/error_logging/types';

let currentUserId: string | undefined;

export function setCurrentUserId(userId: string | undefined) {
  currentUserId = userId;
}

export interface ErrorContext {
  componentName: string;
  errorType?: ErrorType;
  apiEndpoint?: string;
  httpStatusCode?: number;
  severity?: ErrorSeverity;
}

export async function logErrorSilently(
  error: unknown,
  context: ErrorContext
): Promise<void> {
  try {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    const severity = context.severity || classifyErrorSeverity(
      errorMessage,
      context.httpStatusCode
    );
    
    const browserInfo = getBrowserInfo();
    
    backend.error_logging.logClientError({
      user_id: currentUserId,
      error_type: context.errorType || 'unknown',
      component_name: context.componentName,
      error_message: errorMessage,
      error_stack: errorStack,
      api_endpoint: context.apiEndpoint,
      http_status_code: context.httpStatusCode,
      browser_info: browserInfo,
      severity,
    }).catch(() => {
      console.error('[Error Logger Failed]', errorMessage);
    });
    
    console.error(
      `[${context.componentName}] ${context.errorType || 'Error'}:`,
      errorMessage,
      { context, error }
    );
    
  } catch (metaError) {
    console.error('[Silent Error Handler Failed]', metaError);
  }
}

function classifyErrorSeverity(
  message: string,
  statusCode?: number
): ErrorSeverity {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('auth') || statusCode === 401 || statusCode === 403) {
    return 'critical';
  }
  
  if (statusCode && statusCode >= 500) {
    return 'high';
  }
  
  if (statusCode && statusCode >= 400) {
    return 'medium';
  }
  
  if (lowerMessage.includes('network') || lowerMessage.includes('timeout')) {
    return 'medium';
  }
  
  return 'low';
}

function getBrowserInfo(): BrowserInfo {
  return {
    user_agent: navigator.userAgent,
    screen_width: window.screen.width,
    screen_height: window.screen.height,
    browser: getBrowserName(),
    os: getOSName(),
  };
}

function getBrowserName(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Unknown';
}

function getOSName(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Win')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Unknown';
}
