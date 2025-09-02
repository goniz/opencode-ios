import { NativeModule } from 'expo';
import { ExpoSSHModuleEvents } from './ExpoSSH.types';
declare class ExpoSSHModule extends NativeModule<ExpoSSHModuleEvents> {
    PI: number;
    hello(): string;
    setValueAsync(value: string): Promise<void>;
}
declare const _default: ExpoSSHModule;
export default _default;
//# sourceMappingURL=ExpoSSHModule.d.ts.map