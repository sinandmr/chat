import { IRequestUser } from '@/common/types/request.type';
import { Injectable } from '@nestjs/common';
import { Message, Prisma } from '@prisma/client';

import { PrismaService } from './prisma.service';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService
  ) { }

  async saveMessage(data: Prisma.MessageCreateInput, user: IRequestUser): Promise<Message> {
    return await this.prisma.message.create({
      data
    })
  }
}