import * as React from 'react';

import { ExpoSSHViewProps } from './ExpoSSH.types';

export default function ExpoSSHView(props: ExpoSSHViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
