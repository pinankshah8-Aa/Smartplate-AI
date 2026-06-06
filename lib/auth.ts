import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'hackathon-fallback-secret';

export const signToken = (payload: object, expiresIn: any = '1d') => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};
