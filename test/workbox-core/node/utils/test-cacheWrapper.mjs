import {expect} from 'chai';
import sinon from 'sinon';
import makeServiceWorkerEnv from 'service-worker-mock';

// import expectError from '../../../../infra/utils/expectError';
import cacheWrapper from '../../../../packages/workbox-core/utils/cacheWrapper.mjs';

describe(`workbox-core cacheWrapper`, function() {
  let sandbox;

  before(function() {
    sandbox = sinon.sandbox.create();

    const swEnv = makeServiceWorkerEnv();
    Object.assign(global, swEnv);
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe(`.put()`, function() {
    // TODO Add Error Case Tests (I.e. bad input)

    it(`should work with a request and response`, async function() {
      const testCache = await caches.open('TEST-CACHE');
      const cacheOpenStub = sandbox.stub(global.caches, 'open');
      const cachePutStub = sandbox.stub(testCache, 'put');
      cacheOpenStub.callsFake(async (cacheName) => {
        return testCache;
      });
      const putRequest = new Request('/test/string');
      const putResponse = new Response('Response for /test/string');
      await cacheWrapper.put(putRequest, putResponse);

      expect(cacheOpenStub.callCount).to.equal(2);
      const cacheName1 = cacheOpenStub.args[0][0];
      expect(cacheName1).to.equal('TODO-CHANGE-ME');
      const cacheName2 = cacheOpenStub.args[1][0];
      expect(cacheName2).to.equal('TODO-CHANGE-ME');

      expect(cachePutStub.callCount).to.equal(1);
      const cacheRequest = cachePutStub.args[0][0];
      const cacheResponse = cachePutStub.args[0][1];
      expect(cacheRequest).to.equal(putRequest);
      expect(cacheResponse).to.equal(putResponse);
    });

    it(`should not cache opaque responses by default`, async function() {
      const testCache = await caches.open('TEST-CACHE');
      const cacheOpenStub = sandbox.stub(global.caches, 'open');
      const cachePutStub = sandbox.stub(testCache, 'put');
      cacheOpenStub.callsFake(async (cacheName) => {
        return testCache;
      });
      const putRequest = new Request('/test/string');
      const putResponse = new Response('Response for /test/string', {
        // The mock doesn't allow a status of zero due to a bug
        // so mock to 1.
        status: 1,
      });
      await cacheWrapper.put(putRequest, putResponse);

      expect(cacheOpenStub.callCount).to.equal(0);
      expect(cachePutStub.callCount).to.equal(0);
    });

    it(`should call cacheDidUpdate`, async function() {
      const firstPlugin = {
        cacheDidUpdate: () => {},
      };

      const secondPlugin = {
        cacheDidUpdate: () => {},
      };


      const spyOne = sandbox.spy(firstPlugin, 'cacheDidUpdate');
      const spyTwo = sandbox.spy(secondPlugin, 'cacheDidUpdate');

      const putRequest = new Request('/test/string');
      const putResponse = new Response('Response for /test/string');
      await cacheWrapper.put(putRequest, putResponse, [
        firstPlugin,
        {
          // Should work without require functions
        },
        secondPlugin,
      ]);

      expect(spyOne.callCount).to.equal(1);
      expect(spyOne.args[0][0]).to.equal('TODO-CHANGE-ME');
      expect(spyOne.args[0][1]).to.equal(putRequest);
      expect(spyOne.args[0][2]).to.equal(null);
      expect(spyOne.args[0][3]).to.equal(putResponse);
      expect(spyTwo.callCount).to.equal(1);
      expect(spyTwo.args[0][0]).to.equal('TODO-CHANGE-ME');
      expect(spyTwo.args[0][1]).to.equal(putRequest);
      expect(spyTwo.args[0][2]).to.equal(null);
      expect(spyTwo.args[0][3]).to.equal(putResponse);

      const putResponseUpdate = new Response('Response for /test/string number 2');
      await cacheWrapper.put(putRequest, putResponseUpdate, [
        firstPlugin,
        {
          // Should work without require functions
        },
        secondPlugin,
      ]);

      expect(spyOne.callCount).to.equal(2);
      expect(spyOne.args[1][0]).to.equal('TODO-CHANGE-ME');
      expect(spyOne.args[1][1]).to.equal(putRequest);
      expect(spyOne.args[1][2]).to.equal(putResponse);
      expect(spyOne.args[1][3]).to.equal(putResponseUpdate);
      expect(spyTwo.callCount).to.equal(2);
      expect(spyTwo.args[1][0]).to.equal('TODO-CHANGE-ME');
      expect(spyTwo.args[1][1]).to.equal(putRequest);
      expect(spyTwo.args[1][2]).to.equal(putResponse);
      expect(spyTwo.args[1][3]).to.equal(putResponseUpdate);
    });

    it(`should call cacheWillUpdate`, async function() {
      const firstPluginResponse = new Response('Response for /test/string/1');
      const firstPlugin = {
        cacheWillUpdate: () => {
          return firstPluginResponse;
        },
      };

      const secondPlugin = {
        cacheWillUpdate: () => {
          return new Response('Response for /test/string/2');
        },
      };


      const spyOne = sandbox.spy(firstPlugin, 'cacheWillUpdate');
      const spyTwo = sandbox.spy(secondPlugin, 'cacheWillUpdate');

      const putRequest = new Request('/test/string');
      const putResponse = new Response('Response for /test/string');
      await cacheWrapper.put(putRequest, putResponse, [
        firstPlugin,
        {
          // Should work without require functions
        },
        secondPlugin,
      ]);

      expect(spyOne.callCount).to.equal(1);
      expect(spyOne.args[0][0]).to.equal(putRequest);
      expect(spyOne.args[0][1]).to.equal(putResponse);
      expect(spyTwo.callCount).to.equal(1);
      expect(spyTwo.args[0][0]).to.equal(putRequest);
      expect(spyTwo.args[0][1]).to.equal(firstPluginResponse);
    });
  });
});