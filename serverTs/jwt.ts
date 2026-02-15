import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: string;
  // Add more properties as needed
}

class JwtHandler {
  private readonly secretKey: string;

  constructor(secretKey: string) {
    this.secretKey = secretKey;
  }

  // Generate a JWT token
  generateToken(payload: JwtPayload, expiresIn: string | number): string {
    return jwt.sign(payload, this.secretKey, { expiresIn });
  }

  // Verify and decode a JWT token
  verifyToken(token: string): JwtPayload | null {
    try {
      const decoded = jwt.verify(token, this.secretKey) as JwtPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }
}

export default JwtHandler;
