/**
 * Environment configuration for the IDOC app.
 * Prioritizes explicit env override to keep mobile/dev/prod stable.
 */

const API_BASE_URL_DEV = 'http://localhost:8000/api/v1';
const API_BASE_URL_PROD = 'http://144.126.239.34/api/v1';

const getEnvApiBaseUrl = () => {
  try {
    if (typeof process !== 'undefined' && process?.env?.EXPO_PUBLIC_API_BASE_URL) {
      return process.env.EXPO_PUBLIC_API_BASE_URL;
    }
  } catch (e) {
    // Ignore environment access issues.
  }
  return '';
};

/**
 * On native mobile, localhost is usually unreachable unless using emulator mapping,
 * so default to production URL when no explicit env override is provided.
 */
export const getApiBaseUrl = () => {
  const envOverride = getEnvApiBaseUrl();
  if (envOverride) return envOverride;

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return API_BASE_URL_DEV;
    }
  }

  try {
    if (__DEV__) {
      return API_BASE_URL_PROD;
    }
  } catch (e) {
    // Non-RN runtime.
  }

  return API_BASE_URL_PROD;
};

export const getWebSocketUrl = () => {
  const baseUrl = getApiBaseUrl();
  return baseUrl
    .replace(/^http:\/\//, 'ws://')
    .replace(/^https:\/\//, 'wss://')
    .replace(/\/api\/v1$/, '');
};

export const getEnvironmentName = () => {
  const url = getApiBaseUrl();
  return url.includes('localhost') ? 'development' : 'production';
};

export const CONFIG = {
  API: {
    BASE_URL: getApiBaseUrl(),
    WEBSOCKET_URL: getWebSocketUrl(),
    TIMEOUT: 15000,
  },
  ENVIRONMENT: getEnvironmentName(),
  DEBUG: __DEV__ || false,
};

export default CONFIG;
