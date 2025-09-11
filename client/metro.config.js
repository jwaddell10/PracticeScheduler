// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add resolver configuration for native modules
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Add mock resolution for Expo Go testing
config.resolver.alias = {
  'react-native-purchases': './mocks/react-native-purchases.js',
  'react-native-mmkv': './mocks/react-native-mmkv.js',
};

module.exports = config;
