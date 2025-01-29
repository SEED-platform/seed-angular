export type User = {
  org_id?: number;
  org_name?: string;
  org_role?: string;
  ali_name?: string;
  ali_id?: number;
  is_ali_root?: boolean;
  is_ali_leaf?: boolean;
  pk?: number;
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  username?: string;
  is_superuser?: boolean;
  api_key?: string;
  name?: string;
}

export type SetDefaultOrganizationResponse = {
  status: string;
  user: {
    id: number;
    access_level_instance: {
      id: number;
      name: string;
    };
  };
}
