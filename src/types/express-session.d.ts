import type { Request } from 'express';

export interface SessionRequest extends Request {
  session: Request['session'] & {
    user?: {
      id: string;
      mobile: string;
      role: string;
      name?: string;
      email?: string;
    };
  };
}