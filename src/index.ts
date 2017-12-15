import { InitParams, Item, Param } from './types';
import { getDefaultInitParams, prepareItems, getBatches, sendBatches, resolveParam } from './helpers';
import { getNow, getCache, setCache } from './side-effects';
import { BATCH_SIZE } from './consts';

export class Analytics {
  private trackId: Param<string>;
  private apiVersion: Param<string>;
  private clientId: Param<string>;
  private userId: Param<string>;
  private appName: Param<string>;
  private appVersion: Param<string>;
  private language: Param<string>;
  private userAgent: Param<string>;
  private viewport: Param<string>;
  private screenResolution: Param<string>;

  constructor(trackId: string, params: InitParams = {}) {
    this.trackId = trackId;
    const initParams = { ...getDefaultInitParams(), ...params };
    Object.keys(initParams).forEach(key => (this[key] = initParams[key]));
  }

  public async send(hitType: string, additionalParams: object = {}) {
    const now = getNow();
    const params = this.getParams(hitType, additionalParams, now);
    const cache = getCache();
    const items = prepareItems([ ...cache, params ], this.trackId, now);
    const batches = getBatches(items, BATCH_SIZE);
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
