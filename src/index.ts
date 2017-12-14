import { InitParams, Item } from './types';
import { getDefaultInitParams, prepareItems, getBatches, sendBatches, resolveParam } from './helpers';
import { getNow, getCache, setCache } from './side-effects';

export class Analytics {
  private trackId: string;
  private apiVersion: string;
  private clientId: string;
  private userId: string;
  private appName: string;
  private appVersion: string;
  private language: string;
  private userAgent: string;
  private viewport: string;
  private screenResolution: string;

  constructor(trackId: string, params: InitParams = {}) {
    this.trackId = trackId;
    const initParams = { ...getDefaultInitParams(), ...params };
    Object.keys(initParams).forEach(key => (this[key] = initParams[key]));
  }

  public async send(hitType: string, additionalParams: object = {}) {
    const now = getNow();
    const params = this.getParams(hitType, additionalParams, now);
    const cache = getCache();
    const items = prepareItems([ ...cache, params ], now);
    const batches = getBatches(items);
    const failedItems = await sendBatches(batches);
    setCache(failedItems);
  }

  private getParams(hitType: string, additionalParams = {}, time: number): Item {
    return {
      __timestamp: time,
      t: hitType,
      v: resolveParam(this.apiVersion),
      tid: resolveParam(this.trackId),
      cid: resolveParam(this.clientId),
      an: resolveParam(this.appName),
      av: resolveParam(this.appVersion),
      ul: resolveParam(this.language),
      ua: resolveParam(this.userAgent),
      vp: resolveParam(this.viewport),
      sr: resolveParam(this.screenResolution),
      ...additionalParams
    };
  }
}

export default Analytics;
