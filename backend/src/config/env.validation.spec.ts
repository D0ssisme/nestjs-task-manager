import { envSchema } from './env.validation.js';

describe('Environment configuration', () => {
  const valid = { DATABASE_URL: 'postgresql://localhost/testdb', JWT_SECRET: 'test-only-secret' };

  it('accepts the required application config without SMTP settings', () => {
    const { error, value } = envSchema.validate(valid);
    expect(error).toBeUndefined();
    expect(value.PORT).toBe(3001);
    expect(value.JWT_EXPIRES_IN).toBe('15m');
  });

  it('rejects a missing database URL', () => {
    expect(envSchema.validate({ JWT_SECRET: valid.JWT_SECRET }).error).toBeDefined();
  });

  it('rejects missing or short JWT secrets', () => {
    expect(envSchema.validate({ DATABASE_URL: valid.DATABASE_URL }).error).toBeDefined();
    expect(envSchema.validate({ ...valid, JWT_SECRET: 'short' }).error).toBeDefined();
  });

  it('converts the configured port to a number and rejects invalid values', () => {
    const result = envSchema.validate({ ...valid, PORT: '3101' });
    expect(result.error).toBeUndefined();
    expect(result.value.PORT).toBe(3101);
    expect(envSchema.validate({ ...valid, PORT: 'invalid' }).error).toBeDefined();
  });
});
