import { NativeModule } from 'expo';
import { ChangeEventPayload } from './ExpoSSH.types';
type ExpoSSHModuleEvents = {
    onChange: (params: ChangeEventPayload) => void;
};
declare class ExpoSSHModule extends NativeModule<ExpoSSHModuleEvents> {
    PI: number;
    setValueAsync(value: string): Promise<void>;
    hello(): string;
}
declare const _default: typeof ExpoSSHModule;
export default _default;
//# sourceMappingURL=ExpoSSHModule.web.d.ts.map