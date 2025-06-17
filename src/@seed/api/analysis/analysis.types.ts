// Highlight Subset type
export type Highlight = {
  name: string;
  value: string;
}

// Analysis type
export type Analysis = {
  id: number;
  service: string;
  status: string;
  name: string;
  created_at: string;
  start_time: string;
  end_time: string;
  configuration: Record<string, unknown>; // configuration is different for each analysis type
  parsed_results: Record<string, unknown>; // parsed_results is different for each analysis type
  user: number;
  organization: number;
  access_level_instance: number;
  number_of_analysis_property_views: number;
  views: number[];
  cycles: number[];
  highlights: Highlight[];
  _finished_with_tasks: boolean; // used to determine if an analysis has no currently running tasks
}

// Analysis by View type
export type View = {
  id: number;
  analysis: number;
  cycle: number;
  display_name: string;
  output_files: Record<string, unknown>[];
  parsed_results: Record<string, unknown>;
  property: number;
  property_state: number;
}

// OriginalView is an array of key values where the key is a string and the value is a number
export type OriginalView = Record<string, number>

export type ListAnalysesResponse = {
  status: 'success';
  analyses: Analysis[];
  views: View[];
  original_views: OriginalView[];
}

export type AnalysisResponse = {
  status: 'success';
  analysis: Analysis;
}

export type PropertyAnalysesResponse = {
  status: 'success';
  analyses: Analysis[];
}

export type AnalysesViews = {
  analyses: Analysis[];
  views: View[];
}

export type AnalysisViews = {
  status: 'success';
  views: View[];
  original_views: OriginalView[];
}

export type AnalysisView = {
  status: 'success';
  view: View;
  original_view: OriginalView;
}

export type AnalysesMessage = {
  id: number;
  analysis: number;
  analysis_property_view: number;
  debug_message: string;
  type: string;
  user_message: string;
}

export type ListMessagesResponse = {
  status: 'success';
  messages: AnalysesMessage[];
}

export type AnalysisSummary = {
  stats: AnalysisSummaryStats[];
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
