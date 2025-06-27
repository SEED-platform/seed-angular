import type { Column } from '../column'

export type MappingSuggestionsResponse = {
  status: string;
  property_columns: Column[];
  suggested_column_mappings: SuggestedColumnMapping;
  taxlot_columns: Column[];
}

export type SuggestedColumnMapping = Record<string, [table: string, columnName: string, confidence: number]>

export type RawColumnNamesResponse = {
  status: string;
  raw_columns: string[];
}

export type FirstFiveRowsResponse = {
  status: string;
  first_five_rows: Record<string, unknown>[];
}
