
import { validate as isUUID } from 'uuid';

import { HttpException, HttpStatus } from '@nestjs/common';

export default (value: string | undefined, name): void => {
  if (value && !isUUID(value)) {
    throw new HttpException(`Invalid "${name}" id`, HttpStatus.BAD_REQUEST);
  }
}