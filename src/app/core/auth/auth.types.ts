export type TokenResponse = {
  access: string;
  refresh: string;
}

export type UserToken = {
  token_type: 'access' | 'refresh';
  exp: number;
  iat: number;
  jti: string;
  user_id: number;
}
