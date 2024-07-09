declare global {
  namespace Express {
    interface Request {
      userId: number | undefined;
      sessionId: number | undefined;
    }
  }
}
export {};
