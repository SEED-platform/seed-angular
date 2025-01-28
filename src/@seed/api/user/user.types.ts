export type UserRole = 'viewer' | 'member' | 'owner'

export type CurrentUser = {
  org_id: number;
  org_name: string;
  org_role: UserRole;
  ali_name: string;
  ali_id: number;
  is_ali_root: boolean;
  is_ali_leaf: boolean;
  pk: number;
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  is_superuser: boolean;
  api_key: string;
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
