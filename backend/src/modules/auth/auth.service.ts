import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/db';
import { env } from '../../config/env';
import { LoginInput } from './auth.schema';

export async function loginService(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw Object.assign(new Error('Invalid email or password'), { status: 401 });
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw Object.assign(new Error('Invalid email or password'), { status: 401 });
  }

  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}
