import { Response } from 'express';
import { Server } from 'socket.io';

import { Queries } from '@/common/decorators/crud-queries.decorator';
import { User } from '@/common/decorators/user.decorator';
import { HttpErrorFilter } from '@/common/filters/error.filters';
import { ICRUDQueries } from '@/common/types/crud.interface';
import { IRequestUser } from '@/common/types/request.type';
import converter from '@/common/utils/query.converter';
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
    let messages: any;
    try {
      const { recipient_id, user_id: me, query } = data || {};

      validateUUID(recipient_id as string, 'recipient_id');
      validateUUID(me as string, 'user_id');

      const queries = converter(query)

      validateUUID(recipient_id as string, 'id');

      messages = await this.chat.getChat(recipient_id as string, me, queries);

      if (!messages || messages.length === 0)
        throw new Error('No messages found');
    } catch (err) {
      return this.server.emit('error', err.message);
    } finally {
      return messages
    }
  }
}