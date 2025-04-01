export type UserRole = 'viewer' | 'member' | 'owner'

export type CurrentUser = {
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  api_key: string;
  is_superuser: boolean;
  id: number;
  pk: number;
  two_factor_method: 'disabled' | 'email' | 'token';
  org_id: number;
  org_name: string;
  org_role: UserRole;
  ali_name: string;
  ali_id: number;
  is_ali_root: boolean;
  is_ali_leaf: boolean;
  org_user_id: number;
  settings: Record<string, unknown>;
}

export type UserUpdateRequest = {
  first_name: string;
  last_name: string;
  email: string;
}

export type PasswordUpdateRequest = {
  current_password: string;
  password_1: string;
  password_2: string;
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

export type GenerateApiKeyResponse = {
  status: string;
  api_key: string;
}

export type PasswordUpdateResponse = {
  status: string;
}
