import type { ProgressResponse } from '@seed/api/progress'

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
  data: ProgressResponse;
  offset: number;
  multiplier: number;
  progressBarObj: ProgressBarObj;
}
