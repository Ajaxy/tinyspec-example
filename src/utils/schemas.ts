import * as RefParser from 'json-schema-ref-parser';
import spec = require('../../spec/swagger.json');

const refParser = new RefParser();
const isPrepared = false;

export const schemas = spec.definitions;

export const prepareSchemas = async () => {
  if (!isPrepared) {
    const { definitions } = await refParser.dereference(spec);

    Object.assign(schemas, definitions);
  }
};
