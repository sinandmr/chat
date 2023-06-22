import { validate as isUUID } from 'uuid';

export default (value: string | undefined, name): void => {
  if (value && !isUUID(value)) {
    throw new Error(`Invalid id: ${name}`);
  }
}