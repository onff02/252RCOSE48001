import bcrypt from "bcryptjs";

export async function hashPassword(plainTextPassword: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(plainTextPassword, saltRounds);
}

export async function verifyPassword(plainTextPassword: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(plainTextPassword, passwordHash);
}


