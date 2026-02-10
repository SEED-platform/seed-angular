export type CycleGoal = {
  id: number;
  salesforce_annual_report_id?: string;
  salesforce_annual_report_name?: string;
  current_cycle: {
    end: string;
    start: string;
    name: string;
  };
}

export type Goal = {
  access_level_instance: number;
  area_column: number;
  area_column_name: string;
  baseline_cycle: number;
  baseline_cycle_name: string;
  commitment_sqft: number;
  eui_column1: number;
  eui_column1_name: string;
  eui_column2?: number;
  eui_column2_name?: string;
  eui_column3?: number;
  eui_column3_name?: string;
  id: number;
  level_name: string;
  level_name_index: number;
  name: string;
  organization: number;
  partner_note: string;
  partner_note_approval: boolean;
  partner_note_approval_time?: string;
  partner_note_approval_user?: number;
  salesforce_goal_id?: string;
  salesforce_goal_name?: string;
  salesforce_partner_id?: string;
  salesforce_partner_name?: string;
  target_percentage: number;
  transactions_column?: string;
  type: 'standard' | 'transaction';
  access_level_instance_name: string;
  cycle_goals: CycleGoal[];
}

export type GoalsResponse = {
  status: string;
  goals: Goal[];
}

export type PortfolioSummary = {
  baseline_cycle_name: string;
  baseline_total_sqft: number;
  baseline_total_kbtu: number;
  baseline_weighted_eui: number;
  total_properties: number;
  shared_sqft: number;
  total_passing: number;
  total_new_or_acquired: number;
  passing_committed: number;
  passing_shared: number;
  current_cycle_name: string;
  current_total_sqft: number;
  current_total_kbtu: string;
  current_weighted_eui: number;
  sqft_change: number;
  eui_change: number;
}

export type WeightedEUI = {
  'Cycle Name': string;
  'Baseline?': string;
  EUI: string;
  Goal: number;
  'Annual % Imp': number;
  'Cumulative % Imp': number;
}

export type weightedEUIsResponse = {
  status: string;
  results: WeightedEUI[];
}
