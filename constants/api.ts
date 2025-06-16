/**
 * API-related constants
 */

export const API_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const SUPABASE_CONFIG = {
  SESSION_REFRESH_INTERVAL: 60000, // 60 seconds
  SESSION_EXPIRY_BUFFER: 300000, // 5 minutes
  MAX_RETRY_ATTEMPTS: 3,
  CONNECTION_TIMEOUT: 10000, // 10 seconds
} as const;

export const CONNECTION_STATUS = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  REFRESHING: 'refreshing',
} as const;