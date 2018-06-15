import * as Router from 'koa-router';
import { AppContext } from '../utils/AppContext';
import { requirePermissions, requireRole, byAuth } from '../middleware/acl';
import { Company } from '../lib/sequelize';
import { serializeCompany } from '../serializers/Company.serializer';
import { NOT_FOUND } from '../utils/errors';
import { schemas } from '../utils/schemas';
import { validate } from '../utils/validate';

const authenticateAgent = requirePermissions(['companies']);
const authenticateClient = requireRole('Company Admin');

const router = new Router();
router.get('/', byAuth([
  [authenticateAgent, indexForAgent],
  [authenticateClient, indexForClient],
]));
router.post('/', authenticateAgent, create);
router.get('/:id', authenticateAgent, show);
router.patch('/:id', authenticateAgent, update);
router.delete('/:id', authenticateAgent, destroy);

async function indexForAgent(ctx: AppContext) {
  const { search, perPage, page, sort, filter } = ctx.request.query;

  if (filter) {
    await validate(schemas.CompanyFilter, filter);
  }

  const { rows, count } = await Company.scope('notGuest').search({ search, perPage, page, sort, filter });
  const serialized = rows.map(serializeCompany);

  ctx.body = {
    companies: serialized,
    totalCount: count
  };
}

async function indexForClient(ctx: AppContext) {
  const companies = await ctx.state.user.getCompanies();
  const serialized = companies.map(serializeCompany);

  ctx.body = {
    companies: serialized
  };
}

async function create(ctx: AppContext) {
  const newData: Api.CompanyNew = ctx.request.body.company;

  await validate(schemas.CompanyNew, newData);

  const company = await Company.create(newData);
  const serialized = serializeCompany(company);

  ctx.body = { company: serialized };
}

async function show(ctx: AppContext) {
  const company = await findCompany(ctx);
  const serialized = serializeCompany(company);

  ctx.body = { company: serialized };
}

async function update(ctx: AppContext) {
  const companyData: Api.CompanyUpdate = ctx.request.body.company;
  const company = await findCompany(ctx);

  await validate(schemas.CompanyUpdate, companyData);
  await company.update(companyData);

  const serialized = serializeCompany(company);

  ctx.body = { company: serialized };
}

async function destroy(ctx: AppContext) {
  const company = await findCompany(ctx);

  await company.destroy();

  ctx.body = { success: true };
}

async function findCompany(ctx: AppContext) {
  const company = await Company.findById(ctx.params.id);

  if (!company) {
    throw NOT_FOUND;
  }

  return company;
}

const companies = router.routes();
export { companies };
