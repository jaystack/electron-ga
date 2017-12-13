import { remote } from 'electron';
import { machineIdSync } from 'node-machine-id';
import { CACHE_KEY_NAME } from './consts';

export const getAppName = () => remote.app.getName();

export const getAppVersion = () => remote.app.getVersion();

export const getClientId = () => machineIdSync();

export const getLanguage = (): string => window.navigator.language;

export const getUserAgent = (appName: string): string =>
  window.navigator.userAgent
    .replace(new RegExp(`${appName}\/\d+\\.\d+\\.\d+ `), '')
    .replace(/Electron\/\d+\.\d+\.\d+ /, '');

export const getViewport = () => `${window.innerWidth}x${window.innerHeight}`;

export const getScreenResolution = () => {
  const screen = remote.screen.getPrimaryDisplay();
  return `${screen.size.width}x${screen.size.height}`;
}

export const getNow = () => Date.now();

export const getCache = (): any[] => {
  const cache = window.localStorage.getItem(CACHE_KEY_NAME);
  return cache ? JSON.parse(cache) : [];
};

export const setCache = (cache: object[]): void => {
  window.localStorage.setItem(CACHE_KEY_NAME, JSON.stringify(cache));
};

export const fetch = window.fetch;
