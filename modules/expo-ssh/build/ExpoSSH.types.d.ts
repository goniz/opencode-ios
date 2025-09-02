import type { StyleProp, ViewStyle } from 'react-native';
export type OnLoadEventPayload = {
    url: string;
};
export type SSHConnectionEventPayload = {
    host: string;
    port: number;
};
export type SSHOutputEventPayload = {
    output: string;
};
export type SSHErrorEventPayload = {
    error: string;
};
export type ExpoSSHModuleEvents = {
    onSSHConnected: (params: SSHConnectionEventPayload) => void;
    onSSHDisconnected: () => void;
    onSSHOutput: (params: SSHOutputEventPayload) => void;
    onSSHError: (params: SSHErrorEventPayload) => void;
};
export type ChangeEventPayload = {
    value: string;
};
export type ExpoSSHViewProps = {
    url: string;
    onLoad: (event: {
        nativeEvent: OnLoadEventPayload;
    }) => void;
    style?: StyleProp<ViewStyle>;
};
//# sourceMappingURL=ExpoSSH.types.d.ts.map