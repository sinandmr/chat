import { AppService } from '@/services/app.service';
import { Controller, Get, Res } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(@Res() res: Response): any {
    res.json({
      message: 'Hello World!'
    })
  }
}
