import { Response } from 'express';
import { Server } from 'socket.io';

import { Queries } from '@/common/decorators/crud-queries.decorator';
import { User } from '@/common/decorators/user.decorator';
import { HttpErrorFilter } from '@/common/filters/error.filters';
import { ICRUDQueries } from '@/common/types/crud.interface';
import { IRequestUser } from '@/common/types/request.type';
import validateUUID from '@/common/utils/uuid.validate';
import { ChatService } from '@/services/chat.service';
import {
  Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Put, Res, UseFilters
} from '@nestjs/common';
import {
  ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, WsResponse
} from '@nestjs/websockets';
import { Prisma, PrismaClient } from '@prisma/client';

@WebSocketGateway({
  cors: {
    origin: '*',
  }
})
@UseFilters(HttpErrorFilter)
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private chat: ChatService) { }

  @SubscribeMessage('getChat')
  async getChat(@MessageBody() data: any): Promise<unknown> {
    try {
      const { recipient_id, user_id: me } = data || {};


      validateUUID(recipient_id as string, 'id');

      const messages = await this.chat.getChat(recipient_id as string, me);

      console.log(messages);

      if (!messages || messages.length === 0)
        throw { message: 'Messages not found', code: HttpStatus.OK, success: true };

      return messages
    } catch (err) {
      return this.server.emit('exception', err.message);
    }
  }
}