export type Rule = {
  condition: Condition;
  cross_cycle: boolean;
  data_type: number;
  enabled: boolean;
  field: string;
  for_derived_column: boolean;
  id: number;
  max: number | null;
  min: number | null;
  not_null: boolean;
  required: boolean;
  rule_type: number;
  severity: number;
  status_label: number;
  table_name: 'PropertyState' | 'TaxLotState' | 'Goal';
  text_match: string | null;
  units: string;
}

export type Condition = 'exclude' | 'include' | 'required' | 'not_null' | 'range'

import type { FormControl, FormGroup } from '@angular/forms'
export type InventoryFormGroup = FormGroup<{
  id: FormControl<number | null>;
  enabled: FormControl<boolean>;
  condition: FormControl<'exclude' | 'include' | 'required' | 'not_null' | 'range'>;
  field: FormControl<string>;
  data_type: FormControl<number | null>;
  min: FormControl<number | null>;
  max: FormControl<number | null>;
  text_match: FormControl<string | null>;
  units: FormControl<string>;
  severity: FormControl<number | null>;
  status_label: FormControl<number | null>;
}>

export type UnitSymbols = 'ft**2' | 'm**2' | 'kBtu/ft**2/year' | 'gal/ft**2/year' | 'GJ/m**2/year' | 'MJ/m**2/year' | 'kWh/m**2/year' | 'kBtu/m**2/year'
export type UnitNames = 'square feet' | 'square metres' | 'kBtu/sq. ft./year' | 'gal/sq. ft./year' | 'GJ/m²/year' | 'MJ/m²/year' | 'kWh/m²/year' | 'kBtu/m²/year'
