import { NativeModule, requireNativeModule } from 'expo';

import { ExpoSSHModuleEvents } from './ExpoSSH.types';

declare class ExpoSSHModule extends NativeModule<ExpoSSHModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoSSHModule>('ExpoSSH');
