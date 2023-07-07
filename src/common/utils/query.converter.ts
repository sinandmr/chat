import { ICRUDQueries } from '../types/crud.interface';

const converter = (query: any, data: any = null) => {
  const crud: ICRUDQueries = {
    skip: query.offset ? query.offset : 0,
    take: query.limit ? query.limit : 10,
    where: query.filters ? query.filters : {},
    orderBy: query.order ? query.order : [],
    include: query.with ? query.with : '',
    select: query.select ? query.select : ''
  };

  if (Array.isArray(data) && data.length > 0) {
    return {
      ...data.reduce((acc, cur) => {
        acc[cur] = crud[cur];
        return acc;
      }, {})
    }
  }

  if (data) {
    return {
      [data]: crud[data]
    };
  }

  return crud;
}

export default converter;