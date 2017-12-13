import { stringify } from 'qs';
import { remote } from 'electron';
import { machineIdSync } from 'node-machine-id';
import { InitParams, Param } from './types';

const URL = 'https://www.google-analytics.com/batch';
const CACHE_ITEM_NAME = 'analytics-cache';
const BATCH_SIZE = 20;

export default class {
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
    const now = Date.now();
    const params = this.getParams(hitType, additionalParams, now);
    const cache = getCache();
    const items = prepareItems([ ...cache, params ], now);
    const batches = getBatches(items);
    const failedItems = await sendBatches(batches);
    setCache(failedItems);
  }

  private getParams(hitType: string, additionalParams: object = {}, time: number) {
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

const getDefaultInitParams = (): InitParams => ({
  apiVersion: '1',
  clientId: machineIdSync(),
  appName: remote.app.getName(),
  appVersion: remote.app.getVersion(),
  language: navigator.language,
  userAgent: navigator.userAgent
    .replace(new RegExp(`${remote.app.getName()}\/\d+\\.\d+\\.\d+ `), '')
    .replace(/Electron\/\d+\.\d+\.\d+ /, ''),
  viewport: () => `${window.innerWidth}x${window.innerHeight}`,
  screenResolution: () => {
    const screen = remote.screen.getPrimaryDisplay();
    return `${screen.size.width}x${screen.size.height}`;
  }
});

const resolveParam = <T>(value: Param<T>): T => (typeof value === 'function' ? value() : value);

const getCache = (): any[] => {
  const cache = window.localStorage.getItem(CACHE_ITEM_NAME);
  return cache ? JSON.parse(cache) : [];
};

const setCache = (cache: object[]): void => {
  window.localStorage.setItem(CACHE_ITEM_NAME, JSON.stringify(cache));
};

const prepareItems = (items: any[], time): any[] => items.map(item => ({ ...item, qt: time - item.__timestamp }));

const getBatches = (items: any[]): any[][] =>
  items.reduce(
    (batches, item) =>
      batches[batches.length - 1].length >= BATCH_SIZE
        ? [ ...batches, [ item ] ]
        : [ ...batches.slice(0, batches.length - 1), [ ...batches[batches.length - 1], item ] ],
    [ [] ]
  );

const sendBatches = async ([ batch, ...others ], failedItems: any[] = []): Promise<any[]> => {
  if (!batch) return failedItems;
  try {
    await fetch(URL, { method: 'post', body: batch.map(item => stringify(item)).join('\n') });
    return await sendBatches(others, failedItems);
  } catch (error) {
    return await sendBatches(others, [ ...failedItems, ...batch ]);
  }
};
