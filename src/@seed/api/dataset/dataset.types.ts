// Subset type
type ImportFile = {
  created: string;
  modified: string;
  deleted: boolean;
  import_record: number;
  cycle: number;
  file: string;
  uploaded_filename: string;
  cached_first_row: string;
  id: number;
}

// Subset type
type Dataset = {
  deleted: boolean;
  name: string;
  app: 'seed';
  owner: number;
  access_level_instance: number;
  start_time: string;
  finish_time: string;
  created_at: string;
  updated_at: number;
  last_modified_by: string;
  matching_done: boolean;
  super_organization: number;
  id: number;
  model: 'data_importer.importrecord';
  importfiles: ImportFile[];
}

export type ListDatasetsResponse = {
  status: 'success';
  datasets: Dataset[];
}

export type CountDatasetsResponse = {
  status: 'success';
  datasets_count: number;
}
