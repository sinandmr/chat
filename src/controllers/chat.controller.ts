import { Response } from 'express';

import { User } from '@/common/decorators/user.decorator';
import { HttpErrorFilter } from '@/common/filters/error.filters';
import { IRequestUser } from '@/common/types/request.type';
import validateUUID from '@/common/utils/uuid.validate';
import { ChatService } from '@/services/chat.service';
import {
  Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Put, Res, UseFilters
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

@Controller('chat')
@UseFilters(HttpErrorFilter)
export class ChatController {
  constructor(private chat: ChatService) { }

  @Get(':id')
  async getChat(@Param('id') id: string, @User() me: IRequestUser, @Res() res: Response) {
    try {
      validateUUID(id as string, 'id');

      const messages = await this.chat.getChat(id as string, me.id);

      if (!messages)
        throw new Error('Messages not found');

      res.status(HttpStatus.OK).json({
        success: true,
        payload: {
          data: messages
        }
      })
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
    }
  }

  @Post('mesage')
  async send(@Body() data: Prisma.MessageCreateInput, @User() me: IRequestUser, @Res() res: Response) {
    try {
      const { message, recipient, group, reply_to } = data || {};

      validateUUID(recipient as string, 'recipient')
      validateUUID(group as string, 'group')
      validateUUID(reply_to as string, 'reply_to')

      const messageData: Prisma.MessageCreateInput = {
        message,
        author: {
          connect: {
            id: me.id
          }
        },
        ...(recipient && { recipient: { connect: { id: recipient as string } } }),
        ...(group && { group: { connect: { id: group as string } } }),
        ...(reply_to && { reply_to: { connect: { id: reply_to as string } } })
      };

      const sent = await this.chat.save(messageData, me);

      if (!sent)
        throw new Error('Message not sent');

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

  @Put('message/:id')
  async seen(@Param('id') id: string, @User() me: IRequestUser, @Res() res: Response) {
    try {
      validateUUID(id as string, 'id');

      const updated = await this.chat.transaction(async (prisma: PrismaClient) => {

        const message = await prisma.message.findUnique({
          where: {
            id: id as string,
          },
        });

        if (!message) {
          throw new Error('Message not found');
        }

        if (message.author_id === me.id)
          throw new Error('You cannot mark your own message as seen');

        message.seen = true;
        message.seen_at = new Date();

        return await prisma.message.update({
          where: {
            id: id as string,
          },
          data: message,
        });
      });

      if (!updated)
        throw new Error('Message not updated');

      res.status(HttpStatus.OK).json({
        success: true,
        payload: {
          message: updated
        }
      })
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
    }
  }

  @Delete('message/:id')
  async delete(@Param('id') id: string, @User() me: IRequestUser, @Res() res: Response) {
    try {
      validateUUID(id as string, 'id');

      const message = await this.chat.get(id as string);

      if (!message)
        throw new Error('Message not found');

      if (message.author_id !== me.id)
        throw new Error('You cannot delete this message');

      const deleted = await this.chat.delete(id as string);

      if (!deleted)
        throw new Error('Message not deleted');

      res.status(HttpStatus.OK).json({
        success: true,
        payload: {
          message: deleted
        }
      })
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
    }
  }

  @Post('group')
  async createGroup(@Body() data: Prisma.GroupCreateInput | any, @User() me: IRequestUser, @Res() res: Response) {

    try {
      const { name, users } = data || {};

      if (!Array.isArray(users))
        throw new Error('Users must be an array');

      users.push(me.id);

      const group = await this.chat.transaction(async () => {

        const groupData: Prisma.GroupCreateInput = {
          name,
          active: true,
          created_by: {
            connect: {
              id: me.id
            }
          }
        };

        const group = await this.chat.saveGroup(groupData);

        if (!group)
          throw new Error('Group not created');

        const userGroupData: Prisma.UserGroupCreateManyInput[] = users.map((id: string) => ({
          user_id: id,
          group_id: group.id
        }));

        const saveUsers = await this.chat.addUserToGroup(userGroupData);

        if (!saveUsers)
          throw new Error('Group not created');

        return await this.chat.getGroup(group.id);
      });

      if (!group)
        throw new HttpException('Group not created', HttpStatus.BAD_REQUEST);

      res.status(HttpStatus.OK).json({
        success: true,
        payload: {
          group
        }
      })
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
    }
  }

  @Delete('group/:id')
  async deleteGroup(@Param('id') group_id: string, @User() me: IRequestUser, @Res() res: Response) {
    try {

      validateUUID(group_id as string, 'group_id');

      const group = await this.chat.getGroup(group_id as string);

      if (!group)
        throw new Error('Group not found');

      const groupUsers = group['GroupUsers'].map((user: any) => user.id);

      const deletedGroup = await this.chat.transaction(async () => {

        const deletedGroup = await this.chat.deleteGroup(group_id as string);

        if (!deletedGroup)
          throw new Error('Group not deleted');

        const deleteUsers = await this.chat.removeUserFromGroup(groupUsers, group_id);

        if (!deleteUsers)
          throw new Error('Group not deleted');

        return deletedGroup
      });

      if (deletedGroup)
        throw new Error('Group not deleted');

      res.status(HttpStatus.OK).json({
        success: true,
        payload: {
          group: deletedGroup
        }
      });

    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
    }
  }

  @Post('group/user')
  async addUserToGroup(@Body() data: { users: string[], group_id: string }, @User() me: IRequestUser, @Res() res: Response) {
    try {

      const { users, group_id } = data || {};

      validateUUID(group_id as string, 'group_id');

      if (!Array.isArray(users))
        throw new Error('Users must be an array');

      users.forEach((id: string) => validateUUID(id, 'user_id'));

      const group = await this.chat.getGroup(group_id as string);

      if (!group)
        throw new Error('Group not found');

      if (group.created_by_id !== me.id)
        throw new Error('You cannot add user to this group');

      const userGroupData: Prisma.UserGroupCreateManyInput[] = users.map((id: string) => ({
        user_id: id,
        group_id: group.id
      }));

      const added = await this.chat.addUserToGroup(userGroupData);

      if (!added)
        throw new Error('User not added');

      res.status(HttpStatus.OK).json({
        success: true,
        payload: {
          group
        }
      });
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
    }
  }

  @Delete('group/user/:group_id/:user_id')
  async removeUserFromGroup(@Param() params: { group_id: string, user_id: string }, @User() me: IRequestUser, @Res() res: Response) {
    try {
      const { user_id, group_id } = params || {};

      validateUUID(user_id as string, 'user_id');
      validateUUID(group_id as string, 'group_id');

      if (user_id === me.id)
        throw new Error('You cannot remove yourself from this group');

      const group = await this.chat.getGroup(group_id as string);

      if (!group)
        throw new Error('Group not found');

      if (!group['GroupUsers'].find((user: any) => user.user_id === user_id))
        throw new Error('User not found in this group');

      if (group.created_by_id !== me.id)
        throw new Error('You cannot remove user from this group');

      const removed = await this.chat.removeUserFromGroup([user_id as string], group_id);

      if (!removed)
        throw new Error('User not removed');

      res.status(HttpStatus.OK).json({
        success: true,
        payload: {
          user_id: user_id,
        }
      });
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
    }
  }
}