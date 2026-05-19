// Augment Express Request with user context injected by authMiddleware
declare namespace Express {
  interface Request {
    userId: number;
    username: string;
  }
}
