export type AnalysisSummary = {
  stats: AnalysisSummaryStats[]
  number_extra_data_fields: number;
  status: string;
  total_records: number;
}

export type AnalysisSummaryStats = {
  column_name: string;
  count: number;
  display_name: string;
  is_extra_data: boolean;
}