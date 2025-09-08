import jwt from "jsonwebtoken";
import type { SignOptions, Secret } from "jsonwebtoken";

type JwtPayloadBase = {
  sub: string; // user id
  username: string;
};

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET || "dev-insecure-secret";
  return secret;
}

export function signJwt(
  payload: JwtPayloadBase,
  expiresIn: SignOptions["expiresIn"] = (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"]
): string {
  const options: SignOptions = {};
  if (expiresIn) options.expiresIn = expiresIn;
  return jwt.sign(payload, getJwtSecret() as Secret, options);
}

export function verifyJwt<T extends object = JwtPayloadBase>(token: string): T | null {
  try {
    return jwt.verify(token, getJwtSecret() as Secret) as T;
  } catch {
    return null;
  }
}


