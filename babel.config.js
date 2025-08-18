module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo', 
        { 
          reanimated: false // Disable automatic reanimated plugin inclusion
        }
      ]
    ],
    plugins: [
      'react-native-worklets/plugin' // Use the new worklets plugin instead
    ],
  };
};