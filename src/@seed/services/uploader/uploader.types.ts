export type UploaderStatus = 'not-started' | 'in-progress' | 'completed' | 'failed'

export type UploaderResponse = {
  func_name: string;
  message: string | null;
  progress: number;
  progress_key: string;
  stacktrace: string | null;
  status: UploaderStatus;
  status_message: string;
  summary: string | null;
  total: number;
  unique_id: string;
  total_records?: number;
  completed_records?: number;
}

export type ProgressBarObj = {
  message: string;
  progress: number;
  complete: boolean;
  statusMessage: string;
  progressLastUpdated: number | null;
  progressLastChecked: number | null;
  totalRecords?: number | null;
  completedRecords?: number | null;
}

export type CheckProgressLoopParams = {
  progressKey: string;
  offset: number;
  multiplier: number;
  successFn: () => void;
  failureFn: () => void;
  progressBarObj: ProgressBarObj;
}

export type UpdateProgressBarObjParams = {
  data: UploaderResponse;
  offset: number;
  multiplier: number;
  progressBarObj: ProgressBarObj;
}
