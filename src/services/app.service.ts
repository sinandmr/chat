import { Injectable, Res } from '@nestjs/common';
import { Response } from 'express';

@Injectable()
export class AppService {
  getHello(@Res() res: Response): void {
    res.json({
      message: 'Hello World!'
    })
  }
}
