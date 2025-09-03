import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './ExpoSSH.types';

type ExpoSSHModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class ExpoSSHModule extends NativeModule<ExpoSSHModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(ExpoSSHModule, 'ExpoSSHModule');
