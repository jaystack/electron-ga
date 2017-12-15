# electron-ga
[Google Analytics](https://developers.google.com/analytics/devguides/collection/protocol/v1/) client for [Electron](https://electronjs.org/) applications with some useful builtin features

## Features

- **Unique [Client ID](https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#cid) for every machine**, where your app has been installed
- Cache for **offline usage**
- **Promise-based** API
- It sends the following **params by default**:
  - [Protocol Version](https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#v)
  - [Client ID](https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#cid): unique for every machine
  - [Application Name](https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#an)
  - [Application Version](https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#av)
  - [User Language](https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#ul): determined by user agent
  - [User Agent](https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#ul): prepared to make interpretable for Analytics to parse the Platform info
  - [Screen Resolution](https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#sr)
  - [Viewport Size](https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#vp)

## Easy to start using

First create a [Google Analytics Mobile Account](https://developers.google.com/analytics/solutions/mobile). It is needed, because webpage account does not track many parameters, like version. In many aspect an [Electron](https://electronjs.org/) application is more similar to a mobile application than a simple webpage.

[electron-ga]() works only in the [renderer process](https://electronjs.org/docs/tutorial/quick-start#renderer-process).

```js
import Analytics from 'electron-ga';

const analytics = new Analytics('UA-XXXXXXXX-X');
```

Then:

```js
await analytics.send('screenview', { cd: 'User List' });
await analytics.send('event', { ec: 'Scroll', ea: 'scrollto', el: 'row', ev: 123 });
```

[electron-ga]() uses [Google Analytics Measurement Protocol](https://developers.google.com/analytics/devguides/collection/protocol/v1/). You can add custom [parameters](https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters) or ovveride any of them.

## API Reference

### **`constructor`**`(trackId[, initParams])`

The `trackId` is a string and its format is: `UA-XXXXXXXX-X`.

The `initParams` is an object and its optional properties are:

- **protocolVersion**
- **trackId**
- **clientId**
- **userId** - undefined by default
- **appName**
- **appVersion**
- **language**
- **userAgent**
- **viewport**
- **screenResolution**

You can set any of them with a constant string value or a getter function, that returns a string value:

```js
const analytics = new Analytics('UA-XXXXXXXX-X', {
  userId: '123456',
  language: () => store.getState().language
});
```

### **`send`**`(hitType[, additionalParams]) -> Promise`

The `hitType` is a string. You can find here the [available values](https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#t).

The `additionalParams` is an object with any properties, which are acceptable by the [Google Analytics Measurement Protocol](https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters).

---

## License

[MIT](https://spdx.org/licenses/MIT)

## Developed by

[![JayStack](http://jaystack.com/wp-content/uploads/2017/08/jaystack_logo_transparent_50.png)](http://jaystack.com/)
