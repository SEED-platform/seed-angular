import type { Column } from '../column'

export type MappingSuggestionsResponse = {
  status: string;
  property_columns: Column[];
  suggested_column_mappings: Record<string, string>;
  taxlot_columns: Column[];
}

export type RawColumnNamesResponse = {
  status: string;
  raw_columns: string[];
}

export type FirstFiveRowsResponse = {
  status: string;
  first_five_rows: Record<string, unknown>[];
}
