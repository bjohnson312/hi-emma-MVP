export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ErrorType = 'api_failure' | 'network' | 'permission' | 'validation' | 'unknown';

export interface BrowserInfo {
  user_agent: string;
  screen_width: number;
  screen_height: number;
  browser: string;
  os: string;
}

export interface LogClientErrorRequest {
  user_id?: string;
  error_type: ErrorType;
  component_name: string;
  error_message: string;
  error_stack?: string;
  api_endpoint?: string;
  http_status_code?: number;
  browser_info?: BrowserInfo;
  session_id?: string;
  severity?: ErrorSeverity;
}

export interface ClientError {
  id: string;
  user_id: string | null;
  error_type: string;
  component_name: string;
  error_message: string;
  error_stack: string | null;
  api_endpoint: string | null;
  http_status_code: number | null;
  user_agent: string | null;
  browser_info: BrowserInfo | null;
  session_id: string | null;
  severity: ErrorSeverity;
  resolved: boolean;
  admin_notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ListClientErrorsRequest {
  severity?: ErrorSeverity;
  error_type?: ErrorType;
  component_name?: string;
  resolved?: boolean;
  user_id?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

export interface ListClientErrorsResponse {
  errors: ClientError[];
  total: number;
}

export interface MarkErrorResolvedRequest {
  error_id: string;
  admin_notes?: string;
}
