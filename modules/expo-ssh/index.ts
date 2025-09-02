// Reexport the native module. On web, it will be resolved to ExpoSSHModule.web.ts
// and on native platforms to ExpoSSHModule.ts
export { default } from './src/ExpoSSHModule';
export { default as ExpoSSHView } from './src/ExpoSSHView';
export * from  './src/ExpoSSH.types';
