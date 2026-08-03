import type { CycleGoal, Goal } from '@seed/api'

export type ConfigureGoalsData = {
  goals: Goal[];
  isLoggedIntoBbSalesforce: boolean;
  bb_salesforce_enabled: boolean;
}

export type AddCycleData = {
  currentGoal: Goal;
  isLoggedIntoBbSalesforce: boolean;
  existingCycleGoal?: CycleGoal;
}

export type LabelColumnKey = 'baseline' | 'current'

export type PortfolioSummaryGridContext = {
  labelsExpanded: Record<LabelColumnKey, boolean>;
  toggleLabels: (key: LabelColumnKey) => void;
}
