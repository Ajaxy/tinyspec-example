import * as _ from 'lodash';
import { Company } from 'lib/sequelize';
import { schemas } from '../utils/schemas';

export function serializeCompany(company: Company): Api.Company {
  if (!company) {
    return null;
  }

  const props = Object.keys(schemas.Company);

  return _.pick(company, props);
}
