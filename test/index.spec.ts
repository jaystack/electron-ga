import 'jest';
import Analytics from '../src/index';
import { URL } from '../src/consts';

jest.mock('../src/side-effects');
const {
  getClientId,
  getAppName,
  getAppVersion,
  getLanguage,
  getUserAgent,
  getViewport,
  getScreenResolution,
  fetch,
  getCache,
  setCache,
  getNow
} = require('../src/side-effects');

describe('Analytics', () => {
  beforeEach(() => {
    getAppName.mockReturnValue('abc-xyz.io');
    getClientId.mockClear();
    getAppVersion.mockClear();
    getLanguage.mockClear();
    getUserAgent.mockClear();
    getViewport.mockClear();
    getScreenResolution.mockClear();

    getAppName.mockReturnValue('abc-xyz.io');
    getClientId.mockReturnValue('123');
    getAppVersion.mockReturnValue('1.0.0');
    getLanguage.mockReturnValue('en-GB');
    getUserAgent.mockReturnValue(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) abc-xyz.io/1.0.0 Chrome/58.0.3029.110 Electron/1.7.9 Safari/537.36'
    );
    getViewport.mockReturnValue('100x100');
    getScreenResolution.mockReturnValue('200x200');
  });

  describe('constructor', () => {
    it('sets the default initial params', () => {
      const analytics = new Analytics('123456');

      expect(analytics).toHaveProperty('trackId', '123456');
      expect(analytics).toHaveProperty('protocolVersion', '1');
      expect(analytics).toHaveProperty('clientId', '123');
      expect(analytics).toHaveProperty('appName', 'abc-xyz.io');
      expect(analytics).toHaveProperty('appVersion', '1.0.0');
      expect(analytics).toHaveProperty('language', 'en-GB');
      expect(analytics).toHaveProperty(
        'userAgent',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
      );
      expect((<() => string>analytics['viewport'])()).toEqual('100x100');
      expect((<() => string>analytics['screenResolution'])()).toEqual('200x200');
    });

    it('overrides the default initial params', () => {
      const analytics = new Analytics('123456', { userId: '111', clientId: 'aaa', language: () => 'hu' });

      expect(analytics).toHaveProperty('trackId', '123456');
      expect(analytics).toHaveProperty('protocolVersion', '1');
      expect(analytics).toHaveProperty('clientId', 'aaa');
      expect(analytics).toHaveProperty('userId', '111');
      expect(analytics).toHaveProperty('appName', 'abc-xyz.io');
      expect(analytics).toHaveProperty('appVersion', '1.0.0');
      expect(analytics).toHaveProperty(
        'userAgent',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
      );
      expect((<() => string>analytics['language'])()).toEqual('hu');
      expect((<() => string>analytics['viewport'])()).toEqual('100x100');
      expect((<() => string>analytics['screenResolution'])()).toEqual('200x200');
    });
  });

  describe('method getParams', () => {
    it('returns params object', () => {
      const analytics = new Analytics('123456');
      expect(analytics['getParams']('event', { ec: 'Video', ea: 'play', el: 'solarpod', ev: 123 }, 10)).toEqual({
        __timestamp: 10,
        t: 'event',
        v: '1',
        tid: '123456',
        cid: '123',
        an: 'abc-xyz.io',
        av: '1.0.0',
        ul: 'en-GB',
        ua:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
        vp: '100x100',
        sr: '200x200',
        ec: 'Video',
        ea: 'play',
        el: 'solarpod',
        ev: 123
      });
    });
  });

  describe('method send', () => {
    it('sends event with cache', async () => {
      getNow.mockReturnValue(50);
      getCache.mockReturnValue([
        { __timestamp: 10, tid: '123456', a: 1 },
        { __timestamp: 20, tid: '123456', a: 2 },
        { __timestamp: 30, tid: 'abcdef', a: 3 }
      ]);
      fetch.mockReturnValue(Promise.resolve());

      const analytics = new Analytics('123456');
      await analytics.send('event', { ec: 'Video', ea: 'play', el: 'solarpod', ev: 123 });

      expect(fetch.mock.calls[0][0]).toEqual(URL);
      expect(fetch.mock.calls[0][1]).toEqual({
        method: 'post',
        body:
          '__timestamp=10&tid=123456&a=1&qt=40\n__timestamp=20&tid=123456&a=2&qt=30\n__timestamp=30&tid=123456&a=3&qt=20\n__timestamp=50&t=event&v=1&tid=123456&cid=123&an=abc-xyz.io&av=1.0.0&ul=en-GB&ua=Mozilla%2F5.0%20%28Macintosh%3B%20Intel%20Mac%20OS%20X%2010_13_1%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F58.0.3029.110%20Safari%2F537.36&vp=100x100&sr=200x200&ec=Video&ea=play&el=solarpod&ev=123&qt=0'
      });
      expect(setCache).toBeCalledWith([]);
    });

    it('cannot send event with cache', async () => {
      getNow.mockReturnValue(50);
      getCache.mockReturnValue([
        { __timestamp: 10, tid: '123456', a: 1 },
        { __timestamp: 20, tid: '123456', a: 2 },
        { __timestamp: 30, tid: 'abcdef', a: 3 }
      ]);
      fetch.mockReturnValue(Promise.reject(new Error()));

      const analytics = new Analytics('123456');
      await analytics.send('event', { ec: 'Video', ea: 'play', el: 'solarpod', ev: 123 });

      expect(fetch.mock.calls[0][0]).toEqual(URL);
      expect(fetch.mock.calls[0][1]).toEqual({
        method: 'post',
        body:
          '__timestamp=10&tid=123456&a=1&qt=40\n__timestamp=20&tid=123456&a=2&qt=30\n__timestamp=30&tid=123456&a=3&qt=20\n__timestamp=50&t=event&v=1&tid=123456&cid=123&an=abc-xyz.io&av=1.0.0&ul=en-GB&ua=Mozilla%2F5.0%20%28Macintosh%3B%20Intel%20Mac%20OS%20X%2010_13_1%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F58.0.3029.110%20Safari%2F537.36&vp=100x100&sr=200x200&ec=Video&ea=play&el=solarpod&ev=123&qt=0'
      });
      expect(setCache).toBeCalledWith([
        { __timestamp: 10, tid: '123456', a: 1, qt: 40 },
        { __timestamp: 20, tid: '123456', a: 2, qt: 30 },
        { __timestamp: 30, tid: '123456', a: 3, qt: 20 },
        {
          __timestamp: 50,
          t: 'event',
          v: '1',
          tid: '123456',
          cid: '123',
          an: 'abc-xyz.io',
          av: '1.0.0',
          ul: 'en-GB',
          ua:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
          vp: '100x100',
          sr: '200x200',
          ec: 'Video',
          ea: 'play',
          el: 'solarpod',
          ev: 123,
          qt: 0
        }
      ]);
    });
  });
});
