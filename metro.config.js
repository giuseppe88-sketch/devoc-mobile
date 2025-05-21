// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    ...config.resolver.extraNodeModules, // Spread existing extraNodeModules if any
    stream: require.resolve('stream-browserify'),
    buffer: require.resolve('buffer'), // Ensure buffer is polyfilled too
    events: require.resolve('events'),
    http: require.resolve('stream-http'),
    crypto: require.resolve('crypto-browserify'),
  },
};

module.exports = config;
