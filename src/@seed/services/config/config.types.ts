// Types
export type Scheme = 'auto' | 'dark' | 'light'
export type Screens = Record<string, string>
export type Themes = { id: string; name: string }[]

/**
 * AppConfig interface. Update this interface to strictly type your config
 * object.
 */
export type SEEDConfig = {
  layout: string;
  scheme: Scheme;
  screens: Screens;
  theme: 'theme-default';
  themes: Themes;
}
