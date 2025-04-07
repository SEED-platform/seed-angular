export type ColumnMapping = {
  to_field: string;
  from_field: string;
  from_units: string | null;
  to_table_name: 'PropertyState' | 'TaxlotState';
  is_omitted?: boolean;
}

export type ColumnMappingProfile = {
  id: number;
  profile_type: string;
  name: string;
  mappings: ColumnMapping[];
}

export type ColumnMappingProfilesRequest = {
  status: string;
  data: ColumnMappingProfile[];
}

export type ColumnMappingProfileUpdateResponse = {
  status: string;
  data: ColumnMappingProfile;
}

export type ColumnMappingProfileDeleteResponse = {
  status: string;
  data: string;
}

export type ColumnMappingSuggestionResponse = {
  status: string;
  data: Record<string, [('PropertyState' | 'TaxlotState'), string, number]>;
}
