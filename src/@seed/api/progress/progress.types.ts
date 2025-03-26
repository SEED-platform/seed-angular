export type ProgressStatus = 'not-started' | 'parsing' | 'in-progress' | 'completed' | 'failed' | 'success' | 'error'

export type ProgressResponse = {
  func_name: string;
  message: object | string | null;
  progress: number;
  progress_key: string;
  stacktrace: string | null;
  status: ProgressStatus;
  status_message: string;
  summary: string | null;
  total: number | null;
  unique_id: number;
  total_records?: number;
  completed_records?: number;
}
