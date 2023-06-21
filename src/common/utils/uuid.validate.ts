
import { validate as isUUID } from 'uuid';

import { HttpException, HttpStatus } from '@nestjs/common';

export default (value: string | undefined, name): void => {
  if (value && !isUUID(value)) {
    throw new HttpException(`Invalid id: ${name}`, HttpStatus.BAD_REQUEST);
  }
}