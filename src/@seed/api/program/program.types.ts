export type Program = {
  actual_emission_column: number;
  actual_energy_column: number;
  cycles: number[];
  emission_metric_type: string;
  energy_metric_type: string;
  filter_group: null;
  id: number;
  name: string;
  organization_id: number;
  target_emission_column: number;
  target_energy_column: number;
  x_axis_columns: number[];
}

export type ProgramsResponse = {
  status: string;
  compliance_metrics: Program[];
}

export type ProgramResponse = {
  status: string;
  compliance_metric: Program;
}

export type ProgramData = {
  cycles: { id: number; name: string }[];
  graph_data: GraphData;
  meta: { organization: number; compliance_metric: number };
  metric: Program;
  name: string;
  properties_by_cycles: Record<number, Record<string, unknown>[]>;
  // compliant -> n: No, u: Unknown, y: Yes
  results_by_cycle: { n: number[]; u: number[]; y: number[] };
}

type GraphData = {
  datasets: { data: number[]; label: string; backgroundColor?: string }[];
  labels: string[];
}
