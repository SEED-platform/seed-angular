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

export type ProgramResponse = {
  status: string;
  compliance_metrics: Program[];
}
