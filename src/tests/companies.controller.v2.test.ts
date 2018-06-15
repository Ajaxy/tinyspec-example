import * as _ from 'lodash';
import * as chai from 'chai';
import { schemas } from '../utils/schemas';
import { seedUsers } from '../../seeders/seedUsers';
import { Company, User, CompanyUser } from '../../../../lib/sequelize';
import { get, post, patch, del } from '../../../helpers';

const PREFIX_V2 = '/api/v2';
const DUMMY = 'dummy';
const MODIFIED = 'modified';
const REQUIRED = {
  companyName: DUMMY,
  dormant: true,
  industry: DUMMY,
  size: 1,
  status: 'active',
  color: DUMMY,
  dealStatus: DUMMY,
  pipelineStage: DUMMY
};

const { expect } = chai;

describe(__filename, () => {
  let admin: User;
  let user: User;

  beforeEach(async () => {
    const users = await seedUsers(['companies']);
    admin = users.admin;
    user = users.user;
  });

  describe('GET /api/v2/companies', async () => {
    it('Fail with no token', async () => {
      const { status, body } = await get(`${PREFIX_V2}/companies`);

      expect(status).to.equal(401);
      expect(body).to.deep.equal({
        error: true,
        message: 'Unauthorized'
      });
    });

    it('Fail when missing "companies" permission', async () => {
      const { status, body } = await get(`${PREFIX_V2}/companies`, user);

      expect(status).to.equal(403);
      expect(body).to.deep.equal({
        error: true,
        message: 'Forbidden'
      });
    });

    it('Search by `companyName` and `user.(firstName|lastName|idName|nickname|email)`', async () => {
      const dummy = 'dummy';
      const randomEmail = () => `a${Math.random()}@example.com`;

      await seedForSearch([
        ['Jones and Sons', [[dummy, dummy, dummy, dummy, `${randomEmail()}`]]],
        [dummy, [['Karlsson', dummy, dummy, dummy, `${randomEmail()}`]]],
        [dummy, [[dummy, dummy, dummy, dummy, `${randomEmail()}`]]],
        [dummy, [[dummy, 'Sony', dummy, dummy, `${randomEmail()}`]]],
        [dummy, [[dummy, dummy, 'OSONE', dummy, `${randomEmail()}`]]],
        [dummy, [[dummy, dummy, dummy, 'ka son fu', `${randomEmail()}`]]],
        [dummy, [[dummy, dummy, dummy, dummy, 'son@son.son']]],
        // Test for multiple users.
        [dummy, [
          [dummy, dummy, dummy, dummy, `${randomEmail()}`],
          ['Johnson', dummy, dummy, dummy, `${randomEmail()}`],
          ['Carlson', dummy, dummy, dummy, `${randomEmail()}`]
        ]]
      ]);

      const { status, body } =
        await get(`${PREFIX_V2}/companies`, admin, { search: 'son' });

      expect(status).to.equal(200);

      const { companies, totalCount } = body;

      expect(totalCount).to.equal(7);
      expect(companies).to.be.lengthOf(7);
      expect(companies[0]).to.be.validWithSchema(schemas.Company);
    });

    it('Search by phrase in different fields', async () => {
      const dummy = 'dummy';
      const randomEmail = () => `a${Math.random()}@example.com`;

      await seedForSearch([
        ['John and Smith', [[dummy, dummy, dummy, dummy, `${randomEmail()}`]]],
        [dummy, [['Johnny', 'Smith', dummy, dummy, `${randomEmail()}`]]],
        [dummy, [['John', dummy, dummy, dummy, `${randomEmail()}`]]],
        [dummy, [[dummy, 'Smith', dummy, dummy, `${randomEmail()}`]]],
        ['Smith Johnson', [[dummy, dummy, dummy, dummy, `${randomEmail()}`]]],
        [dummy, [[dummy, dummy, dummy, dummy, `${randomEmail()}`]]],
        [dummy, [[dummy, dummy, dummy, dummy, 'john@smith.com']]],
        // Test for multiple users.
        [dummy, [
          [dummy, dummy, dummy, dummy, `${randomEmail()}`],
          ['Johnson', 'Smithy', dummy, dummy, `${randomEmail()}`],
          ['Smithy', 'Johnson', dummy, dummy, `${randomEmail()}`]
        ]]
      ]);

      const { status, body } =
        await get(`${PREFIX_V2}/companies`, admin, { search: 'John Smith' });

      expect(status).to.equal(200);

      const { companies, totalCount } = body;

      expect(totalCount).to.equal(5);
      expect(companies).to.be.lengthOf(5);
      expect(companies[0]).to.be.validWithSchema(schemas.Company);
    });

    it('Return second page', async () => {
      await seedForPagination(50);

      const { status, body } =
        await get(`${PREFIX_V2}/companies`, admin, { perPage: 20, page: 2 });

      expect(status).to.equal(200);

      const { companies, totalCount } = body;

      expect(totalCount).to.equal(50);
      expect(companies).to.be.lengthOf(20);
      expect(companies[0]).to.be.validWithSchema(schemas.Company);
      expect(companies[0].companyName).to.equal('Company 020');
    });

    it('Limit to first page by default', async () => {
      await seedForPagination(30);

      const { status, body } =
        await get(`${PREFIX_V2}/companies`, admin);

      expect(status).to.equal(200);

      const { companies, totalCount } = body;

      expect(totalCount).to.equal(30);
      expect(companies).to.be.lengthOf(25);
      expect(companies[0]).to.be.validWithSchema(schemas.Company);
    });

    it('Sort by `companyName ASC` by default', async () => {
      await seedForSorting();

      const { status, body } =
        await get(`${PREFIX_V2}/companies`, admin);

      expect(status).to.equal(200);

      const { companies } = body;
      expect(companies[0]).to.be.validWithSchema(schemas.Company);

      const expected = _.sortBy(companies, 'companyName');
      expect(companies).to.deep.equal(expected);
    });

    it('Sort by `status ASC, companyName DESC`', async () => {
      await seedForSorting();

      const { status, body } =
        await get(`${PREFIX_V2}/companies`, admin, { sort: 'status,-companyName' });

      expect(status).to.equal(200);

      const { companies } = body;

      expect(companies[0]).to.be.validWithSchema(schemas.Company);

      const expected = _.orderBy(companies, ['status', 'companyName'], ['asc', 'desc']);
      expect(companies).to.deep.equal(expected);
    });

    it('Do not list guest companies', async () => {
      await seedCompany({ status: 'guest' });

      const { status, body } =
        await get(`${PREFIX_V2}/companies`, admin, { sort: 'status,-companyName' });

      expect(status).to.equal(200);

      const { companies } = body;

      expect(companies).to.be.lengthOf(0);
    });

    it('Filter only pending companies', async () => {
      await Promise.all([
        seedCompany({ status: 'active' }),
        seedCompany({ status: 'pending' })
      ]);

      const { status, body } =
        await get(`${PREFIX_V2}/companies`, admin, { filter: { status: 'pending' } });

      expect(status).to.equal(200);

      const { companies } = body;

      expect(companies).to.be.lengthOf(1);
      expect(companies[0].status).to.equal('pending');
    });

    it('Fail on wrong filter options', async () => {
      const { status, body } =
        await get(`${PREFIX_V2}/companies`, admin, { filter: { [DUMMY]: DUMMY } });

      expect(status).to.equal(422);
      expect(body).to.deep.equal({
        error: true,
        message: 'Validation errors: should NOT have additional properties'
      });
    });
  });

  describe('POST /api/v2/companies', () => {
    it('Create new Company', async () => {
      const newEntityData: Api.CompanyNew = {
        ...REQUIRED
      };

      const { status, body } =
        await post(`${PREFIX_V2}/companies`, admin, { company: newEntityData });

      expect(status).to.equal(200);

      const { company } = body;

      expect(company).to.be.validWithSchema(schemas.Company);
      expect(company).to.containSubset(newEntityData);
    });

    it('Fail with restricted properties', async () => {
      const newEntityData = {
        ...REQUIRED,
        id: 0
      };

      const { status, body } =
        await post(`${PREFIX_V2}/companies`, admin, { company: newEntityData });

      expect(status).to.equal(422);
      expect(body).to.deep.equal({
        error: true,
        message: 'Validation errors: should NOT have additional properties'
      });
    });

    it('Fail with missing permissions', async () => {
      const newEntityData = {
        ...REQUIRED,
      };

      const { status, body } =
        await post(`${PREFIX_V2}/companies`, user, { company: newEntityData });

      expect(status).to.equal(403);
      expect(body).to.deep.equal({
        error: true,
        message: 'Forbidden'
      });
    });
  });

  describe('GET /api/v2/companies/:id', () => {
    it('Retrieve particular Company', async () => {
      const testEntity = await seedCompany();

      const { status, body } =
        await get(`${PREFIX_V2}/companies/${testEntity.id}`, admin);

      expect(status).to.equal(200);

      const { company } = body;

      expect(company).to.be.validWithSchema(schemas.Company);
      expect(company.companyName).to.equal(DUMMY);
    });

    it('Fail with missing permissions', async () => {
      const testEntity = await seedCompany();

      const { status, body } =
        await get(`${PREFIX_V2}/companies/${testEntity.id}`, user);

      expect(status).to.equal(403);
      expect(body).to.deep.equal({
        error: true,
        message: 'Forbidden'
      });
    });
  });

  describe('PATCH /api/v2/companies/:id', () => {
    it('Update particular Company (`companyName` and `color`)', async () => {
      const testEntity = await seedCompany();

      const updateEntityData: Api.CompanyUpdate = {
        companyName: MODIFIED,
        color: MODIFIED
      };

      const { status, body } =
        await patch(`${PREFIX_V2}/companies/${testEntity.id}`, admin, { company: updateEntityData });

      expect(status).to.equal(200);

      const { company } = body;

      expect(company).to.containSubset(updateEntityData);

      await testEntity.reload();
      expect(testEntity).to.containSubset(updateEntityData);
    });

    it('Fail with restricted properties', async () => {
      const testEntity = await seedCompany();
      const updateEntityData = {
        companyName: MODIFIED,
        id: 0
      };

      const { status, body } =
        await patch(`${PREFIX_V2}/companies/${testEntity.id}`, admin, { company: updateEntityData });

      expect(status).to.equal(422);
      expect(body).to.deep.equal({
        error: true,
        message: 'Validation errors: should NOT have additional properties'
      });
    });

    it('Fail with missing permissions', async () => {
      const testEntity = await seedCompany();
      const updateEntityData = {
        companyName: MODIFIED,
        id: 0
      };

      const { status, body } =
        await patch(`${PREFIX_V2}/companies/${testEntity.id}`, user, { company: updateEntityData });

      expect(status).to.equal(403);
      expect(body).to.deep.equal({
        error: true,
        message: 'Forbidden'
      });
    });
  });

  describe('DELETE /api/v2/companies/:id', () => {
    it('Delete particular Company', async () => {
      const testEntity = await seedCompany();

      const { status, body } =
        await del(`${PREFIX_V2}/companies/${testEntity.id}`, admin);

      expect(status).to.equal(200);

      const { success } = body;

      expect(success).to.equal(true);

      const expectedNull = await Company.findById(testEntity.id);
      expect(expectedNull).to.equal(null);
    });

    it('Fail with missing permissions', async () => {
      const testEntity = await seedCompany();

      const { status, body } =
        await del(`${PREFIX_V2}/companies/${testEntity.id}`, user);

      expect(status).to.equal(403);
      expect(body).to.deep.equal({
        error: true,
        message: 'Forbidden'
      });
    });
  });
});

function seedCompany(properties = {}) {
  return Company.create({
    ...REQUIRED,
    ...properties
  });
}

async function createUserForCompany(companyId: number, [firstName, lastName, idName, nickname, email]: string[]) {
  const user = await User.create({
    firstName, lastName, idName, nickname, email
  });

  await CompanyUser.create({
    company: companyId,
    user: user.id
  });
}

function seedForSearch(nameGroups: [string, string[][]][]) {
  return Promise.all(nameGroups.map(async ([companyName, users]) => {
    const company = await Company.create(
      {
        ...REQUIRED,
        companyName
      }
    );

    await Promise.all(users.map(async userFields => (
      createUserForCompany(company.id, userFields)
    )));
  }));
}

function seedForPagination(amount: number) {
  return Company.bulkCreate(_.times(amount, (i: number) => ({
    ...REQUIRED,
    companyName: `Company ${_.padStart(String(i), 3, '0')}`
  })));
}

function seedForSorting() {
  return Company.bulkCreate(_.times(10, (i: number) => ({
    ...REQUIRED,
    status: i % 2 === 0 ? Company.status.ACTIVE : Company.status.PENDING,
    companyName: `Company ${_.padStart(String(i), 3, '0')}`
  })));
}
