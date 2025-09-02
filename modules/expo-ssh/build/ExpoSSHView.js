import { requireNativeView } from 'expo';
import * as React from 'react';
export default function ExpoSSHView(props) {
    const NativeView = requireNativeView('ExpoSSH');
    return <NativeView {...props}/>;
}
//# sourceMappingURL=ExpoSSHView.js.map