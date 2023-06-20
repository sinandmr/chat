import { NextFunction, Request, Response } from 'express';

import { AuthService } from '@/services/auth.service';
import { HttpStatus, Inject, Injectable, NestMiddleware } from '@nestjs/common';

declare global {
  namespace Express {
    export interface Request {
      user: Object;
    }
  }
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private auth: AuthService) {
  }

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.headers.authorization.split(' ')[1];

      if (!token) throw new Error('Authentication failed')

      const verify = await this.auth.verifyToken(token)

      if (!verify) throw new Error('Authentication failed')

      req.user = verify;

      next();
    } catch (err) {
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        error: err.message
      })
    }

  }
}
