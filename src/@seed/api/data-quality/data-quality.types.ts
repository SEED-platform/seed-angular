export type Rule = {
  condition: 'exclude' | 'include' | 'required' | 'not_null' | 'range';
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
  status_label: string | null;
  table_name: 'PropertyState' | 'TaxLotState' | 'Goal';
  text_match: string | null;
  units: string;
}

// import type { FormControl, FormGroup } from '@angular/forms'
// export type InventoryFormGroup = FormGroup<{
//   id: FormControl<number | null>;
//   enabled: FormControl<boolean>;
//   condition: FormControl<'exclude' | 'include' | 'required' | 'not_null' | 'range' | ''>;
//   field: FormControl<string>;
//   data_type: FormControl<number | null>;
//   min: FormControl<number | null>;
//   max: FormControl<number | null>;
//   text_match: FormControl<string | null>;
//   units: FormControl<string>;
//   severity: FormControl<number | null>;
//   status_label: FormControl<string | null>;
// }>
