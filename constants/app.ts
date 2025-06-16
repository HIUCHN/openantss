/**
 * App-wide constants
 */

export const APP_CONFIG = {
  NAME: 'OpenAnts',
  TAGLINE: 'Professional Networking',
  VERSION: '1.0.0',
  DESCRIPTION: 'Connect. Collaborate. Create.',
} as const;

export const PLATFORM = {
  WEB: 'web',
  IOS: 'ios',
  ANDROID: 'android',
} as const;

export const ENVIRONMENT = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
} as const;

export const DEBUG_CONFIG = {
  ENABLE_DEBUG_PANEL: true,
  ENABLE_CONSOLE_LOGS: true,
  ENABLE_PERFORMANCE_MONITORING: false,
} as const;