import { User } from '@prisma/client';

export type IRequestUser = Omit<User, 'password' | 'created_at' | 'updated_at'>
