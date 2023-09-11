import { IWireMockRequest, IWireMockResponse, WireMock } from 'wiremock-captain';
import * as request from 'supertest'

describe('EPP docmap', () => {
  const mockDocmapServer = new WireMock('http://localhost:8080');
  const apiServer = request('http://localhost:8080');
  const docmaps = request('http://localhost:8080/docmaps');

  const transitionState = async (state: string) => apiServer.put('/__admin/scenarios/docmap_index/state').send(`{"state": "${state}"}`);

  beforeAll(async () => {
    const request: IWireMockRequest = {
      method: 'GET',
      endpoint: '/docmaps/index',
    }
    const emptyResponse: IWireMockResponse = {
      status: 200,
      body: {
        docmaps: [],
      }
    };
    const oneDocmapResponse: IWireMockResponse = {
      status: 200,
      body: {
        docmaps: [{'@id': '/docmaps/123456', updated: 'before'}],
      }
    };
    const updatedDocmapResponse: IWireMockResponse = {
      status: 200,
      body: {
        docmaps: [{'@id': '/docmaps/123456', updated: 'now'}],
      }
    };
    const newDocmapResponse: IWireMockResponse = {
      status: 200,
      body: {
        docmaps: [{'@id': '/docmaps/123456', updated: 'now'}, {'@id': '/docmaps/123457', updated: 'now'}],
      }
    };
    mockDocmapServer.clearAll();
    await mockDocmapServer.register(request, emptyResponse, {scenario: {scenarioName: 'docmap_index', requiredScenarioState: 'Started'}});
    await mockDocmapServer.register(request, oneDocmapResponse, {scenario: {scenarioName: 'docmap_index', requiredScenarioState: 'one_docmap'}});
    await mockDocmapServer.register(request, updatedDocmapResponse, {scenario: {scenarioName: 'docmap_index', requiredScenarioState: 'updated_docmap'}});
    await mockDocmapServer.register(request, newDocmapResponse, {scenario: {scenarioName: 'docmap_index', requiredScenarioState: 'new_docmap'}});
  });

  it('has an empty docmap', async () => {
    const response = await docmaps.get('/index');
    expect(response.status).toEqual(200);
    expect(response.body).toMatchObject({docmaps: []});
  });

  it('has an one docmap', async () => {
    //transition state
    await transitionState('one_docmap');

    const response = await docmaps.get('/index');
    expect(response.status).toEqual(200);
    expect(response.body).toMatchObject({docmaps: [{'@id': '/docmaps/123456', updated: 'before'}]});
  });

  it('has an updated docmap', async () => {
    //transition state
    await transitionState('updated_docmap');

    const response = await docmaps.get('/index');
    expect(response.status).toEqual(200);
    expect(response.body).toMatchObject({docmaps: [{'@id': '/docmaps/123456', updated: 'now'}]});
  });
  it('has an updated docmap', async () => {
    //transition state
    await transitionState('new_docmap');

    const response = await docmaps.get('/index');
    expect(response.status).toEqual(200);
    expect(response.body.docmaps.length).toEqual(2);
    expect(response.body).toMatchObject({docmaps: [{'@id': '/docmaps/123456', updated: 'now'}, {'@id': '/docmaps/123457', updated: 'now'}]});
  });
});
