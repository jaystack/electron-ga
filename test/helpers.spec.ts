import 'jest';
import { URL } from '../src/consts';
import {
  resolveParam,
  prepareItems,
  getBatches,
  prepareUserAgent,
  getDefaultInitParams,
  sendBatches
} from '../src/helpers';

jest.mock('../src/side-effects');
const {
  getClientId,
  getAppName,
  getAppVersion,
  getLanguage,
  getUserAgent,
  getViewport,
  getScreenResolution,
  fetch
} = require('../src/side-effects');

describe('helpers', () => {
  describe('resolveParam', () => {
    it('resolves the constant number value', () => {
      expect(resolveParam(10)).toEqual(10);
    });

    it('resolves the constant string value', () => {
      expect(resolveParam('aaa')).toEqual('aaa');
    });

    it('resolves the function return number value', () => {
      expect(resolveParam(() => 10)).toEqual(10);
    });

    it('resolves the function return string value', () => {
      expect(resolveParam(() => 'aaa')).toEqual('aaa');
    });
  });

  describe('prepareItems', () => {
    it('extends items with qt property', () => {
      expect(prepareItems([ { a: 1, __timestamp: 10 }, { b: 2, __timestamp: 15 } ], 20)).toEqual([
        { a: 1, __timestamp: 10, qt: 10 },
        { b: 2, __timestamp: 15, qt: 5 }
      ]);
    });
  });

  describe('getBatches', () => {
    it('slices to one part below BATCH_SIZE', () => {
      const items = [ { __timestamp: 1 }, { __timestamp: 2 }, { __timestamp: 3 } ];
      expect(getBatches(items, 3)).toEqual([ items ]);
    });

    it('slices to one part above BATCH_SIZE', () => {
      const items = [ { __timestamp: 1 }, { __timestamp: 2 }, { __timestamp: 3 } ];
      expect(getBatches(items, 2)).toEqual([ [ { __timestamp: 1 }, { __timestamp: 2 } ], [ { __timestamp: 3 } ] ]);
    });
  });

  describe('prepareUserAgent', () => {
    it('removes Electron and appName from userAgent', () => {
      expect(
        prepareUserAgent(
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) abc-xyz.io/1.0.0 Chrome/58.0.3029.110 Electron/1.7.9 Safari/537.36',
          'abc-xyz.io'
        )
      ).toEqual(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
      );
    });
  });

  describe('getDefaultInitParams', () => {
    getAppName.mockReturnValue('abc-xyz.io');
    getClientId.mockReturnValue('123');
    getAppVersion.mockReturnValue('1.0.0');
    getLanguage.mockReturnValue('en-GB');
    getUserAgent.mockReturnValue(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) abc-xyz.io/1.0.0 Chrome/58.0.3029.110 Electron/1.7.9 Safari/537.36'
    );
    getViewport.mockReturnValue('100x100');
    getScreenResolution.mockReturnValue('200x200');
    it('create init params', () => {
      const result = getDefaultInitParams();
      expect(result).toEqual({
        apiVersion: '1',
        clientId: '123',
        appName: 'abc-xyz.io',
        appVersion: '1.0.0',
        language: 'en-GB',
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
        viewport: getViewport,
        screenResolution: getScreenResolution
      });
      expect((<() => string>result.viewport)()).toEqual('100x100');
      expect((<() => string>result.screenResolution)()).toEqual('200x200');
    });
  });

  describe('sendBatches', () => {
    it('does not do anything at empty batches', async () => {
      expect(await sendBatches([])).toEqual([]);
      expect(fetch.mock.calls.length).toEqual(0);
    });

    it('does not do anything at empty batch', async () => {
      expect(await sendBatches([ [] ])).toEqual([]);
      expect(fetch.mock.calls.length).toEqual(0);
    });

    it('send all batches', async () => {
      fetch.mockReturnValue(Promise.resolve());
      expect(
        await sendBatches([ [ { __timestamp: 1, a: 1 }, { __timestamp: 2, a: 2 } ], [ { __timestamp: 3, a: 3 } ] ])
      ).toEqual([]);
      expect(fetch.mock.calls[0][0]).toEqual(URL);
      expect(fetch.mock.calls[0][1]).toEqual({ method: 'post', body: '__timestamp=1&a=1\n__timestamp=2&a=2' });
      expect(fetch.mock.calls[1][0]).toEqual(URL);
      expect(fetch.mock.calls[1][1]).toEqual({ method: 'post', body: '__timestamp=3&a=3' });
    });

    it('collects failed items', async () => {
      fetch.mockReturnValueOnce(Promise.reject(new Error()));
      fetch.mockReturnValueOnce(Promise.resolve());
      expect(
        await sendBatches([ [ { __timestamp: 1, a: 1 }, { __timestamp: 2, a: 2 } ], [ { __timestamp: 3, a: 3 } ] ])
      ).toEqual([ { __timestamp: 1, a: 1 }, { __timestamp: 2, a: 2 } ]);
      expect(fetch.mock.calls[0][0]).toEqual(URL);
      expect(fetch.mock.calls[0][1]).toEqual({ method: 'post', body: '__timestamp=1&a=1\n__timestamp=2&a=2' });
      expect(fetch.mock.calls[1][0]).toEqual(URL);
      expect(fetch.mock.calls[1][1]).toEqual({ method: 'post', body: '__timestamp=3&a=3' });
    });
  });
});
