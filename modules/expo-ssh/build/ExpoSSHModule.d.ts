import { NativeModule } from 'expo';
import { ExpoSSHModuleEvents } from './ExpoSSH.types';
declare class ExpoSSHModule extends NativeModule<ExpoSSHModuleEvents> {
    connect(host: string, port: number, username: string, password?: string, privateKey?: string): Promise<void>;
    executeCommand(command: string): Promise<string>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
}
declare const _default: ExpoSSHModule;
export default _default;
//# sourceMappingURL=ExpoSSHModule.d.ts.map