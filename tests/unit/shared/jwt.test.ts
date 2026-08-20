import { describe, expect, test } from 'vitest';
import { signToken, verifyToken } from '@/shared/utils/jwt';

describe('jwt util', () => {
  test('signToken genera un token que verifyToken puede decodificar con el mismo payload', () => {
    const token = signToken({ sub: 'user-1', email: 'atleta@fightmetrics.dev' });

    const decoded = verifyToken(token);

    expect(decoded.sub).toBe('user-1');
    expect(decoded.email).toBe('atleta@fightmetrics.dev');
  });

  test('verifyToken lanza error si el token está malformado', () => {
    expect(() => verifyToken('token-invalido')).toThrow();
  });

  test('verifyToken lanza error si el token fue firmado con otro secreto', () => {
    // Token válido en forma pero firmado con una clave distinta a env.JWT_SECRET.
    const foreignToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEifQ.' +
      'gXk3nq0wS7pF4uY1sV2cQk9hT8rE6mN0oL3aB5iZ9pQ';

    expect(() => verifyToken(foreignToken)).toThrow();
  });
});
