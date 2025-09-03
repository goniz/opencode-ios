import { NativeModule, requireNativeModule } from 'expo';

import { ExpoSSHModuleEvents } from './ExpoSSH.types';

declare class ExpoSSHModule extends NativeModule<ExpoSSHModuleEvents> {
  connect(host: string, port: number, username: string, password?: string, privateKey?: string): Promise<void>;
  executeCommand(command: string): Promise<string>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoSSHModule>('ExpoSSH');
