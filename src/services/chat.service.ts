import { ICRUDQueries } from '@/common/types/crud.interface';
import { IRequestUser } from '@/common/types/request.type';
import { Injectable } from '@nestjs/common';
import { Group, Message, Prisma, UserGroup } from '@prisma/client';

import { PrismaService } from './prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) { }

  async transaction(callback: any): Promise<any> {
    return await this.prisma.$transaction(callback)
  };

  async getMessage(id: string): Promise<Message> {
    return await this.prisma.message.findUnique({
      where: {
        id
      }
    })
  };

  async getChat(user1Id: string, user2Id: string, queries: ICRUDQueries): Promise<Message[]> {
    return await this.prisma.message.findMany({
      where: {
        OR: [
          { author_id: user1Id, recipient_id: user2Id },
          { author_id: user2Id, recipient_id: user1Id }
        ],
      },
      orderBy: queries.orderBy,
      include: queries.include,
      skip: queries.skip,
      take: queries.take
    })
  };

  async saveMessage(data: Prisma.MessageCreateInput, queries: ICRUDQueries): Promise<any> {
    return await this.prisma.message.create({
      data,
      ...(queries.select ? { select: queries.select } : {}),
      ...(queries.include ? { include: queries.include } : {})
    })
  };

  async updateMessage(data: Prisma.MessageUpdateInput, queries: ICRUDQueries): Promise<any> {
    return await this.prisma.message.update({
      where: {
        id: data.id as string
      },
      data,
      select: queries.select
    })
  };

  async delete(id: string): Promise<Message> {
    return await this.prisma.message.delete({
      where: {
        id
      }
    })
  }

  async getGroup(id: string, queries: ICRUDQueries = {}): Promise<Group> {
    return await this.prisma.group.findUnique({
      where: {
        id,
      },
      ...(queries.where ? { where: queries.where } : {}),
      ...(queries.select ? { select: queries.select } : {}),
      ...(queries.include ? { include: queries.include } : {}),
    })
  }

  async getAllGroups(id: string, query: ICRUDQueries): Promise<Group[]> {
    return await this.prisma.group.findMany({
      where: query.where || {
        GroupUsers: {
          some: {
            user_id: id
          }
        }
      },
      include: query.include,
      skip: query.skip,
      take: query.take,
      orderBy: query.orderBy
    })
  }

  async saveGroup(data: Prisma.GroupCreateInput, queries: ICRUDQueries): Promise<Group> {
    return await this.prisma.group.create({
      data,
      ...(queries.select ? { select: queries.select } : {}),
      ...(queries.include ? { include: queries.include } : {}),
    })
  }

  async deleteGroup(id: string): Promise<any> {
    return await this.prisma.group.delete({
      where: {
        id: id as string
      },
    })
  }

  async addUserToGroup(data: Prisma.UserGroupCreateManyInput[]): Promise<UserGroup | any> {
    return await this.prisma.userGroup.createMany({
      data,
      skipDuplicates: true,
    })
  }

  async removeUserFromGroup(ids: string[], group_id: string): Promise<any> {
    return await this.prisma.userGroup.deleteMany({
      where: {
        user_id: {
          in: ids
        },
        AND: {
          group_id: {
            equals: group_id
          }
        }
      }
    })
  }

};