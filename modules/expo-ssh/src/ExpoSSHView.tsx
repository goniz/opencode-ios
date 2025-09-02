import { requireNativeView } from 'expo';
import * as React from 'react';

import { ExpoSSHViewProps } from './ExpoSSH.types';

export default function ExpoSSHView(props: ExpoSSHViewProps) {
  const NativeView = requireNativeView('ExpoSSH');
  return <NativeView {...props} />;
}
