/**
 * Authentication Middleware and Handlers
 */

import { Env, AuthContext, ApiResponse } from './saas-types';
import {
  hashPassword,
  verifyPassword,
  generateJWT,
  verifyJWT,
  generateApiKey,
  hashApiKey,
  encrypt,
  decrypt,
} from './crypto-utils';
import {
  createUser,
  getUserByEmail,
  getUserById,
  createConnection,
  getConnectionById,
  createApiKey as createApiKeyDb,
  getApiKeyByHash,
  updateApiKeyLastUsed,
  getOrCreateMonthlyUsage,
  incrementMonthlyUsage,
  getPlan,
  getCurrentYearMonth,
  countUserConnections,
} from './db';

// ============================================
// Auth Handlers (for Management API)
// ============================================

/**
 * Register a new user
 */
export async function handleRegister(
  db: D1Database,
  email: string,
  password: string
): Promise<ApiResponse> {
  // Validate input
  if (!email || !password) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Email and password are required',
      },
    };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid email format',
      },
    };
  }

  // Validate password strength
  if (password.length < 8) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Password must be at least 8 characters',
      },
    };
  }

  // Check if user exists
  const existingUser = await getUserByEmail(db, email);
  if (existingUser) {
    return {
      success: false,
      error: {
        code: 'USER_EXISTS',
        message: 'User with this email already exists',
      },
    };
  }

  // Hash password and create user
  const passwordHash = await hashPassword(password);
  const user = await createUser(db, email, passwordHash);

  return {
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan,
      },
    },
  };
}

/**
 * Login user
 */
export async function handleLogin(
  db: D1Database,
  jwtSecret: string,
  email: string,
  password: string
): Promise<ApiResponse> {
  // Validate input
  if (!email || !password) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Email and password are required',
      },
    };
  }

  // Get user
  const user = await getUserByEmail(db, email);
  if (!user) {
    return {
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      },
    };
  }

  // Check if user is active
  if (user.status !== 'active') {
    return {
      success: false,
      error: {
        code: 'ACCOUNT_SUSPENDED',
        message: 'Account is suspended or deleted',
      },
    };
  }

  // Verify password
  const validPassword = await verifyPassword(password, user.password_hash);
  if (!validPassword) {
    return {
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      },
    };
  }

  // Generate JWT
  const token = await generateJWT(
    {
      sub: user.id,
      email: user.email,
      plan: user.plan,
    },
    jwtSecret
  );

  return {
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan,
      },
    },
  };
}

// ============================================
// MCP API Key Authentication
// ============================================

/**
 * Authenticate MCP request using API key
 * Returns auth context or null if invalid
 */
export async function authenticateMcpRequest(
  request: Request,
  env: Env
): Promise<{ context: AuthContext | null; error: ApiResponse | null }> {
  // Extract API key from header
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    return {
      context: null,
      error: {
        success: false,
        error: {
          code: 'MISSING_AUTH',
          message: 'Authorization header is required',
        },
      },
    };
  }

  // Parse Bearer token
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return {
      context: null,
      error: {
        success: false,
        error: {
          code: 'INVALID_AUTH_FORMAT',
          message: 'Authorization header must be "Bearer <api_key>"',
        },
      },
    };
  }

  const apiKey = match[1];

  // Validate API key format
  if (!apiKey.startsWith('saas_')) {
    return {
      context: null,
      error: {
        success: false,
        error: {
          code: 'INVALID_API_KEY',
          message: 'Invalid API key format',
        },
      },
    };
  }

  // Hash the key and lookup
  const keyHash = await hashApiKey(apiKey);

  // Try cache first (KV)
  const cacheKey = `apikey:${keyHash}`;
  let cachedData = await env.RATE_LIMIT_KV?.get(cacheKey, 'json') as {
    user_id: string;
    email: string;
    plan: string;
    connection_id: string;
    n8n_url: string;
    n8n_api_key_encrypted: string;
    api_key_id: string;
  } | null;

  if (!cachedData) {
    // Lookup in database
    const apiKeyRecord = await getApiKeyByHash(env.DB, keyHash);
    if (!apiKeyRecord) {
      return {
        context: null,
        error: {
          success: false,
          error: {
            code: 'INVALID_API_KEY',
            message: 'Invalid or revoked API key',
          },
        },
      };
    }

    // Get user
    const user = await getUserById(env.DB, apiKeyRecord.user_id);
    if (!user || user.status !== 'active') {
      return {
        context: null,
        error: {
          success: false,
          error: {
            code: 'ACCOUNT_SUSPENDED',
            message: 'Account is suspended or deleted',
          },
        },
      };
    }

    // Get connection
    const connection = await getConnectionById(env.DB, apiKeyRecord.connection_id);
    if (!connection || connection.status !== 'active') {
      return {
        context: null,
        error: {
          success: false,
          error: {
            code: 'CONNECTION_INACTIVE',
            message: 'n8n connection is inactive or deleted',
          },
        },
      };
    }

    // Cache for 1 hour
    cachedData = {
      user_id: user.id,
      email: user.email,
      plan: user.plan,
      connection_id: connection.id,
      n8n_url: connection.n8n_url,
      n8n_api_key_encrypted: connection.n8n_api_key_encrypted,
      api_key_id: apiKeyRecord.id,
    };

    await env.RATE_LIMIT_KV?.put(cacheKey, JSON.stringify(cachedData), {
      expirationTtl: 3600, // 1 hour
    });
  }

  // Get plan limits
  const plan = await getPlan(env.DB, cachedData.plan);
  const monthlyLimit = plan?.monthly_request_limit || 100;

  // Check rate limit
  const yearMonth = getCurrentYearMonth();
  const usage = await getOrCreateMonthlyUsage(env.DB, cachedData.user_id, yearMonth);

  if (usage.request_count >= monthlyLimit) {
    return {
      context: null,
      error: {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Monthly request limit exceeded',
          details: {
            limit: monthlyLimit,
            used: usage.request_count,
            plan: cachedData.plan,
          },
        },
      },
    };
  }

  // Decrypt n8n API key
  let n8nApiKey: string;
  try {
    n8nApiKey = await decrypt(cachedData.n8n_api_key_encrypted, env.ENCRYPTION_KEY);
  } catch {
    return {
      context: null,
      error: {
        success: false,
        error: {
          code: 'DECRYPTION_ERROR',
          message: 'Failed to decrypt n8n API key',
        },
      },
    };
  }

  // Update last used (async, don't wait)
  updateApiKeyLastUsed(env.DB, cachedData.api_key_id).catch(() => {});

  // Return auth context
  return {
    context: {
      user: {
        id: cachedData.user_id,
        email: cachedData.email,
        plan: cachedData.plan as 'free' | 'starter' | 'pro' | 'enterprise',
      },
      connection: {
        id: cachedData.connection_id,
        n8n_url: cachedData.n8n_url,
        n8n_api_key: n8nApiKey,
      },
      apiKey: {
        id: cachedData.api_key_id,
      },
      usage: {
        current: usage.request_count,
        limit: monthlyLimit,
        remaining: monthlyLimit - usage.request_count,
      },
    },
    error: null,
  };
}

// ============================================
// Connection & API Key Creation
// ============================================

/**
 * Create a new n8n connection with API key
 */
export async function handleCreateConnection(
  db: D1Database,
  encryptionKey: string,
  userId: string,
  userPlan: string,
  name: string,
  n8nUrl: string,
  n8nApiKey: string
): Promise<ApiResponse> {
  // Validate input
  if (!name || !n8nUrl || !n8nApiKey) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Name, n8n URL, and API key are required',
      },
    };
  }

  // Validate URL format
  try {
    new URL(n8nUrl);
  } catch {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid n8n URL format',
      },
    };
  }

  // Check connection limit
  const plan = await getPlan(db, userPlan);
  const maxConnections = plan?.max_connections || 1;
  const currentConnections = await countUserConnections(db, userId);

  if (maxConnections !== -1 && currentConnections >= maxConnections) {
    return {
      success: false,
      error: {
        code: 'CONNECTION_LIMIT',
        message: `Connection limit reached (${maxConnections} for ${userPlan} plan)`,
      },
    };
  }

  // Test connection to n8n
  try {
    const testResponse = await fetch(`${n8nUrl}/api/v1/workflows?limit=1`, {
      headers: {
        'X-N8N-API-KEY': n8nApiKey,
      },
    });

    if (!testResponse.ok) {
      return {
        success: false,
        error: {
          code: 'CONNECTION_FAILED',
          message: `Failed to connect to n8n: ${testResponse.status} ${testResponse.statusText}`,
        },
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: {
        code: 'CONNECTION_FAILED',
        message: `Failed to connect to n8n: ${err.message}`,
      },
    };
  }

  // Encrypt n8n API key
  const encryptedApiKey = await encrypt(n8nApiKey, encryptionKey);

  // Create connection
  const connection = await createConnection(db, userId, name, n8nUrl, encryptedApiKey);

  // Generate SaaS API key
  const { key, hash, prefix } = await generateApiKey();
  await createApiKeyDb(db, userId, connection.id, hash, prefix, 'Default');

  return {
    success: true,
    data: {
      connection: {
        id: connection.id,
        name: connection.name,
        n8n_url: connection.n8n_url,
        status: connection.status,
        created_at: connection.created_at,
      },
      api_key: key, // Only returned once!
      api_key_prefix: prefix,
      message: 'Save your API key now. It will not be shown again.',
    },
  };
}

// ============================================
// Verify JWT (for Management API)
// ============================================

/**
 * Verify JWT token from Authorization header
 */
export async function verifyAuthToken(
  request: Request,
  jwtSecret: string
): Promise<{ userId: string; email: string; plan: string } | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const token = match[1];

  // Skip if it's an API key (starts with saas_)
  if (token.startsWith('saas_')) return null;

  const payload = await verifyJWT(token, jwtSecret);
  if (!payload) return null;

  return {
    userId: payload.sub,
    email: payload.email,
    plan: payload.plan,
  };
}
