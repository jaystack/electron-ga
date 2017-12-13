import { stringify } from 'qs';
import { InitParams, Param } from './types';
import { URL, BATCH_SIZE } from './consts';
import {
  getAppName,
  getClientId,
  getAppVersion,
  getLanguage,
  getUserAgent,
  getViewport,
  getScreenResolution,
  fetch
} from './side-effects';

export const getDefaultInitParams = (): InitParams => {
  const appName = getAppName();
  return {
    apiVersion: '1',
    clientId: getClientId(),
    appName,
    appVersion: getAppVersion(),
    language: getLanguage(),
    userAgent: getUserAgent(appName),
    viewport: getViewport,
    screenResolution: getScreenResolution
  };
};

export const resolveParam = <T>(value: Param<T>): T => (typeof value === 'function' ? value() : value);

export const prepareItems = (items: any[], time): any[] =>
  items.map(item => ({ ...item, qt: time - item.__timestamp }));

export const getBatches = (items: any[]): any[][] =>
  items.reduce(
    (batches, item) =>
      batches[batches.length - 1].length >= BATCH_SIZE
        ? [ ...batches, [ item ] ]
        : [ ...batches.slice(0, batches.length - 1), [ ...batches[batches.length - 1], item ] ],
    [ [] ]
  );

export const sendBatches = async ([ batch, ...others ], failedItems: any[] = []): Promise<any[]> => {
  if (!batch) return failedItems;
  try {
    await fetch(URL, { method: 'post', body: batch.map(item => stringify(item)).join('\n') });
    return await sendBatches(others, failedItems);
  } catch (error) {
    return await sendBatches(others, [ ...failedItems, ...batch ]);
  }
};
