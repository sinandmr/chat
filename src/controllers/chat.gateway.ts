import { Server } from 'socket.io';

import { HttpErrorFilter } from '@/common/filters/error.filters';
import converter from '@/common/utils/query.converter';
import validateUUID from '@/common/utils/uuid.validate';
import { ChatService } from '@/services/chat.service';
import { HttpException, HttpStatus, UseFilters } from '@nestjs/common';
import {
  MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer
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

  @SubscribeMessage('get chat')
  async getChat(@MessageBody() data: any): Promise<unknown> {
    let messages: any;
    try {
      const { recipient_id, me, query } = data || {};

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

  @SubscribeMessage('send message')
  async send(@MessageBody() data: any) {
    let sent: any;
    try {
      const { message, recipient, group, reply_to, me, query } = data || {};

      const queries = converter(query)

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

      sent = await this.chat.saveMessage(messageData, queries);

      if (!sent)
        throw new Error('Message not sent');
    } catch (err) {
      return this.server.emit('error', err.message);
    } finally {
      return sent
    }
  }

  @SubscribeMessage('seen message')
  async seen(@MessageBody() data: any) {
    let seen: any;
    try {
      const { id, me, query } = data || {};

      const queries = converter(query)

      validateUUID(id as string, 'id');

      seen = await this.chat.transaction(async (prisma: PrismaClient) => {
        const message = await this.chat.getMessage(id);

        if (!message) {
          throw new Error('Message not found');
        }

        if (message.author_id === me)
          throw new Error('You cannot mark your own message as seen');

        message.seen = true;
        message.seen_at = new Date();

        return await this.chat.updateMessage(message, queries);
      });

      if (!seen)
        throw new Error('Message not updated');
    } catch (err) {
      return this.server.emit('error', err.message);
    } finally {
      return seen
    }
  }

  @SubscribeMessage('delete message')
  async delete(@MessageBody() data: any) {
    let deleted: any;
    try {
      const { id, me } = data || {};

      validateUUID(id as string, 'id');

      const message = await this.chat.getMessage(id as string);

      if (!message)
        throw new Error('Message not found');

      if (message.author_id !== me)
        throw new Error('You cannot delete this message');

      deleted = await this.chat.delete(id as string);

      if (!deleted)
        throw new Error('Message not deleted');
    } catch (err) {
      return this.server.emit('error', err.message);
    } finally {
      return deleted
    }
  }

  @SubscribeMessage('create group')
  async createGroup(@MessageBody() data: any) {
    let group: any;
    try {
      const { me, name, users, query } = data || {};

      const queries = converter(query)

      if (!Array.isArray(users))
        throw new Error('Users must be an array');

      users.forEach((id: string, i: number) => validateUUID(id, `${i}. user_id`));

      users.push(me);

      group = await this.chat.transaction(async () => {

        const groupData: Prisma.GroupCreateInput = {
          name,
          active: true,
          created_by: {
            connect: {
              id: me
            }
          }
        };

        const group = await this.chat.saveGroup(groupData, queries);

        if (!group)
          throw new Error('Group not created');

        const userGroupData: Prisma.UserGroupCreateManyInput[] = users.map((id: string) => ({
          user_id: id,
          group_id: group.id
        }));

        const saveUsers = await this.chat.addUserToGroup(userGroupData);

        if (!saveUsers)
          throw new Error('Group not created');

        return await this.chat.getGroup(group.id, queries);
      });

      if (!group)
        throw new HttpException('Group not created', HttpStatus.BAD_REQUEST);
    } catch (err) {
      this.server.emit('error', err.message);
    } finally {
      return group
    }
  }

  @SubscribeMessage('get users groups')
  async getAllGroups(@MessageBody() data: any) {
    let groups: any;
    try {
      const { me, query } = data || {};

      const queries = converter(query)

      validateUUID(me, 'me id');

      groups = await this.chat.getAllGroups(me, queries);

      if (!groups)
        throw new Error('Groups not found');
    } catch (err) {
      this.server.emit('error', err.message);
    } finally {
      return groups
    }
  }

  @SubscribeMessage('delete group')
  async deleteGroup(@MessageBody() data: any) {
    let deletedGroup: any;
    try {
      const { me, group_id } = data || {};

      validateUUID(group_id as string, 'group_id');

      const group = await this.chat.getGroup(group_id as string);

      if (!group)
        throw new Error('Group not found');

      if (group.created_by_id !== me)
        throw new Error('You cannot delete this group');

      const groupUsers = group['GroupUsers']?.map((userGroup: any) => userGroup.user_id);

      deletedGroup = await this.chat.transaction(async () => {
        const deleteUsers = await this.chat.removeUserFromGroup(groupUsers, group.id);

        if (!deleteUsers)
          throw new Error('Failed to remove users from group');

        const deleted = await this.chat.deleteGroup(group_id as string);

        if (!deleted)
          throw new Error('Failed to delete group');

        return deleted;
      });

      if (!deletedGroup)
        throw new Error('Failed to delete group');
    } catch (err) {
      this.server.emit('error', err.message);
    } finally {
      return deletedGroup
    }
  }

  @SubscribeMessage('add user to group')
  async addUserToGroup(@MessageBody() data: any) {
    let group: any;
    try {
      const { me, users, group_id, query } = data || {};

      const queries = converter(query)

      validateUUID(group_id as string, 'group_id');

      if (!Array.isArray(users))
        throw new Error('Users must be an array');

      users.forEach((id: string) => validateUUID(id, 'user_id'));

      group = await this.chat.transaction(async () => {
        const group = await this.chat.getGroup(group_id as string);

        if (!group)
          throw new Error('Group not found');

        if (group.created_by_id !== me)
          throw new Error('You cannot add user to this group');

        const userGroupData: Prisma.UserGroupCreateManyInput[] = users.map((id: string) => ({
          user_id: id,
          group_id: group.id
        }));

        const added = await this.chat.addUserToGroup(userGroupData);

        if (!added)
          throw new Error('User not added');

        return await this.chat.getGroup(group.id, queries);
      });
    } catch (err) {
      this.server.emit('error', err.message);
    } finally {
      return group
    }
  }

  @SubscribeMessage('remove user from group')
  async removeUserFromGroup(@MessageBody() data: any) {
    let removed: any;
    try {
      const { me, user_id, group_id } = data || {};

      validateUUID(user_id as string, 'user_id');
      validateUUID(group_id as string, 'group_id');

      if (user_id === me)
        throw new Error('You cannot remove yourself from this group');

      const group = await this.chat.getGroup(group_id as string, {
        include: {
          GroupUsers: true
        }
      });

      if (!group)
        throw new Error('Group not found');

      if (!group['GroupUsers'].find((user: any) => user.user_id === user_id))
        throw new Error('User not found in this group');

      if (group.created_by_id !== me)
        throw new Error('You cannot remove user from this group');

      removed = await this.chat.removeUserFromGroup([user_id as string], group_id);

      if (!removed)
        throw new Error('User not removed');
    } catch (err) {
      this.server.emit('error', err.message);
    } finally {
      return removed
    }
  }
}