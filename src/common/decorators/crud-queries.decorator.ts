import { createParamDecorator, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';

import { ICRUDQueries } from '../types/crud.interface';

export const Queries = createParamDecorator((data: any, ctx: ExecutionContext) => {
  try {
    const req = ctx.switchToHttp().getRequest();
    const { query } = req;

    const crud: ICRUDQueries = {
      skip: query.offset ? parseInt(query.offset) : 0,
      take: query.limit ? parseInt(query.limit) : 10,
      where: query.filters ? JSON.parse(query.filters) : {},
      orderBy: query.order ? JSON.parse(query.order) : [],
      include: query.with ? JSON.parse(query.with) : '',
      select: query.select ? JSON.parse(query.select) : ''
    };

    if (Array.isArray(data) && data.length > 0) {
      return data.map((key: string) => crud[key]);
    }

    if (data) {
      return {
        [data]: crud[data]
      };
    }

    return crud;
  } catch (err) {
    throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
  }
});