import type { ProgressResponse } from '@seed/api/progress'
import type { Sensor } from '@seed/api/sensor'

export type ProgressBarObj = {
  message: string;
  progress: number;
  complete: boolean;
  statusMessage: string;
  progressLastUpdated: number | null;
  progressLastChecked: number | null;
  totalRecords?: number | null;
  completedRecords?: number | null;
  total?: number;
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

export type UploadResponse = {
  success: boolean;
  import_file_id?: number;
  message?: string;
}

export type SensorPreviewResponse = {
  proposed_imports: Sensor[];
}
