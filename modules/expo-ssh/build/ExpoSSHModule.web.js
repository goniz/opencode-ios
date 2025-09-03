import { registerWebModule, NativeModule } from 'expo';
class ExpoSSHModule extends NativeModule {
    PI = Math.PI;
    async setValueAsync(value) {
        this.emit('onChange', { value });
    }
    hello() {
        return 'Hello world! 👋';
    }
}
;
export default registerWebModule(ExpoSSHModule, 'ExpoSSHModule');
//# sourceMappingURL=ExpoSSHModule.web.js.map