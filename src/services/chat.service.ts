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

  async get(id: string): Promise<Message> {
    return await this.prisma.message.findUnique({
      where: {
        id
      }
    })
  };

  async getChat(user1Id: string, user2Id: string): Promise<Message[]> {
    return await this.prisma.message.findMany({
      orderBy: {
        created_at: 'asc'
      },
      where: {
        OR: [
          { author_id: user1Id, recipient_id: user2Id },
          { author_id: user2Id, recipient_id: user1Id }
        ],
      },
      include: {
        Replies: true,
        _count: true,
        recipient: true
      },
    })
  };

  async save(data: Prisma.MessageCreateInput, user: IRequestUser): Promise<Message> {
    return await this.prisma.message.create({
      data
    })
  };

  async update(data: Prisma.MessageUpdateInput): Promise<Message> {
    return await this.prisma.message.update({
      where: {
        id: data.id as string
      },
      data
    })
  };

  async delete(id: string): Promise<Message> {
    return await this.prisma.message.delete({
      where: {
        id
      }
    })
  }

  async getGroup(id: string): Promise<Group> {
    return await this.prisma.group.findUnique({
      where: {
        id
      },
      include: {
        GroupUsers: true
      }
    })
  }


  async saveGroup(data: Prisma.GroupCreateInput): Promise<Group> {
    return await this.prisma.group.create({
      data,
      include: {
        GroupUsers: true
      }
    })
  }

  async deleteGroup(id: string): Promise<any> {
    return await this.prisma.group.delete({
      where: {
        id
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
          in: ids,
        },
        AND: {
          group_id: {
            in: ids,
          }
        }
      }
    })
  }

};