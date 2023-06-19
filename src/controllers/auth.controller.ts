import { Response } from 'express';

import { AuthService } from '@/services/auth.service';
import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { Prisma } from '@prisma/client';

type IUserLogin = {
  username: string
  password: string
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService,
  ) { }

  @Post('login')
  async login(@Body() data: IUserLogin, @Res() res: Response) {
    try {

      const { username, password }: IUserLogin = data

      const user = await this.auth.find(username)

      if (!user) {
        throw new Error('User not found')
      }

      const isMatch = await this.auth.comparePassword(password, user.password)

      if (!isMatch) {
        throw new Error('Password not match')
      }

      const token = await this.auth.sign(user);

      delete user.password
      delete user.updated_at
      delete user.created_at

      res.status(HttpStatus.OK).json({
        success: true,
        token,
        user
      })
    } catch (err) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        error: err.message
      })
    }
  }

  @Post('register')
  async register(@Body() data: Prisma.UserCreateInput, @Res() res: Response) {
    try {
      const isExist = await this.auth.find(data.username)

      if (isExist) throw new Error('Username or Email already exists')

      const user = await this.auth.save(data)

      if (!user) throw new Error('Failed to create user')

      const token = await this.auth.sign(user);

      delete user.password
      delete user.updated_at
      delete user.created_at

      res.status(HttpStatus.CREATED).json({
        success: true,
        token,
        user
      });

    } catch (err) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        error: err.message
      })
    }
  }
}