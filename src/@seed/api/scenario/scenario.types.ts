export type Scenario = {
  [key: string]: unknown;
  annual_electricity_savings: number;
  annual_natural_gas_savings: number;
  annual_peak_electricity_reduction: number;
  id: number;
  measures: Record<string, unknown>[];
  name: string;
  propertyState: number;
}
