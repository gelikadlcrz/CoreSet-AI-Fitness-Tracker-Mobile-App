// Centralised auth config. Both auth.middleware.ts and users.service.ts
// import JWT_SECRET from here instead of each reading process.env directly.

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set. Add it to apps/api/.env');
}

export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRES_IN = '7d';