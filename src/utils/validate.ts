import * as Ajv from 'ajv';
import * as _ from 'lodash';
import { HttpError } from './errors';

export const validate = async (schema: object, data: object) => {
  const ajv = new Ajv();

  if (!ajv.validate(schema, data)) {
    const messages = _.map(ajv.errors, 'message').join(', ');
    throw new HttpError(422, `Validation errors: ${messages}`);
  }
};
