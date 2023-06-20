import { IRequestUser } from './request.type';

declare global {
  namespace Express {
    export interface Request {
      user: IRequestUser;
    }
  }
}