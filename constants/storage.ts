/**
 * Storage-related constants
 */

export const STORAGE_KEYS = {
  SESSION: 'supabase.auth.token',
  USER_PREFERENCES: 'user.preferences',
  APP_SETTINGS: 'app.settings',
  CACHE_PREFIX: 'cache.',
  DEBUG_LOGS: 'debug.logs',
} as const;

export const CACHE_DURATION = {
  SHORT: 5 * 60 * 1000, // 5 minutes
  MEDIUM: 30 * 60 * 1000, // 30 minutes
  LONG: 24 * 60 * 60 * 1000, // 24 hours
  WEEK: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const;