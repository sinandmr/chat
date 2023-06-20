import { Request, Response } from 'express';
import { validate as isUUID } from 'uuid';

import { HttpErrorFilter } from '@/common/filters/error.filters';
import validateUUID from '@/common/utils/uuid.validate';
import { ChatService } from '@/services/chat.service';
import {
  Body, Controller, Get, HttpException, HttpStatus, Post, Req, Res, UseFilters
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Controller('chat')
@UseFilters(HttpErrorFilter)
export class ChatController {
  constructor(
    private chat: ChatService
  ) { }

  @Post('send')
  async send(@Body() data: Prisma.MessageCreateInput, @Req() req: Request, @Res() res: Response) {
    try {
      const { message, recipient, group, reply_to } = data || {};
      const me = req.user.id;

      validateUUID(recipient as string, 'recipient')
      validateUUID(group as string, 'group')
      validateUUID(reply_to as string, 'reply_to')

      const messageData: Prisma.MessageCreateInput = {
        message,
        author: {
          connect: {
            id: me
          }
        },
        ...(recipient && { recipient: { connect: { id: recipient as string } } }),
        ...(group && { group: { connect: { id: group as string } } }),
        ...(reply_to && { reply_to: { connect: { id: reply_to as string } } })
      };

      const sent = await this.chat.saveMessage(messageData, req.user);

      if (!sent) throw new HttpException('Message not sent', HttpStatus.BAD_REQUEST);

      res.status(HttpStatus.OK).json({
        success: true,
        payload: {
          message: sent
        }
      })
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
    }
  }
}

/*
  message: string
  author: UserCreateNestedOneWithoutSentMessagesInput
  recipient?: UserCreateNestedOneWithoutReceivedMessagesInput
  group?: GroupCreateNestedOneWithoutMessagesInput
  reply_to?: MessageCreateNestedOneWithoutRepliesInput
*/