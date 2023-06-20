import * as bcrypt from 'bcrypt';

import { IRequestUser } from '@/common/types/request.type';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, User } from '@prisma/client';

import { PrismaService } from './prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService
  ) { }

  async find(username: string): Promise<User> {
    return await this.prisma.user.findUnique({
      where: {
        username
      }
    })
  }

  async save(data: Prisma.UserCreateInput): Promise<User> {

    data.password = await this.hashPassword(data.password)

    return await this.prisma.user.create({
      data
    })
  }

  async sign(user: User): Promise<string> {
    return this.jwt.sign({
      ...user
    }, {
      secret: this.config.get('JWT_SECRET'),
    })
  }

  async verifyToken(token: string): Promise<IRequestUser> {
    const verify = await this.jwt.verify(token, {
      secret: this.config.get('JWT_SECRET'),
    })

    delete verify.password
    delete verify.created_at
    delete verify.updated_at

    return verify
  };

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return await bcrypt.hash(password, salt);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }
}
