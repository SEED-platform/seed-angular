import type { Goal } from '@seed/api/goal'

export type ConfigureGoalsData = {
  goals: Goal[];
  isLoggedIntoBbSalesforce: boolean;
  bb_salesforce_enabled: boolean;
}

export type AddCycleData = {
  currentGoal: Goal;
  isLoggedIntoBbSalesforce: boolean;
}
