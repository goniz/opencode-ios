import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

interface IPAInfo {
  path: string;
  bundleId: string;
  version: string;
  displayName: string;
  buildNumber?: string;
  size: number;
  modifiedTime: Date;
}

interface OTAServerState {
  isRunning: boolean;
  serverUrl?: string;
  ipaInfo?: IPAInfo;
  error?: string;
}

export const useOTAServer = () => {
  const [serverState, setServerState] = useState<OTAServerState>({
    isRunning: false
  });

  const selectIPAFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/octet-stream', // IPA files
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return null;
      }

      const file = result.assets[0];
      
      // Validate that it's an IPA file
      if (!file.name.toLowerCase().endsWith('.ipa')) {
        Alert.alert('Invalid File', 'Please select a valid IPA file.');
        return null;
      }

      return {
        uri: file.uri,
        name: file.name,
        size: file.size || 0,
      };
    } catch (error) {
      console.error('Error selecting IPA file:', error);
      Alert.alert('Error', 'Failed to select IPA file. Please try again.');
      return null;
    }
  }, []);

  const extractIPAMetadata = useCallback(async (ipaPath: string): Promise<IPAInfo | null> => {
    try {
      // For now, return basic metadata from filename
      // In a real implementation, you'd extract from the IPA's Info.plist
      const fileName = ipaPath.split('/').pop() || 'Unknown';
      const baseName = fileName.replace('.ipa', '');
      
      const fileInfo = await FileSystem.getInfoAsync(ipaPath);
      
      return {
        path: ipaPath,
        bundleId: `com.dev.${baseName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        version: '1.0.0',
        displayName: baseName,
        buildNumber: '1',
        size: fileInfo.exists ? fileInfo.size || 0 : 0,
        modifiedTime: new Date(fileInfo.exists ? fileInfo.modificationTime * 1000 || Date.now() : Date.now())
      };
    } catch (error) {
      console.error('Error extracting IPA metadata:', error);
      return null;
    }
  }, []);

  const startOTAServer = useCallback(async (ipaFile: { uri: string; name: string; size: number }) => {
    try {
      setServerState({ isRunning: true });

      // Extract metadata
      const ipaInfo = await extractIPAMetadata(ipaFile.uri);
      if (!ipaInfo) {
        throw new Error('Failed to extract IPA metadata');
      }

      // For React Native, we can't directly run the Node.js script
      // Instead, we'll show instructions for running it manually
      const serverUrl = 'http://localhost:8443';
      
      setServerState({
        isRunning: true,
        serverUrl,
        ipaInfo,
      });

      // Show instructions to user
      Alert.alert(
        'OTA Server Instructions',
        `To serve your IPA file:\n\n1. Copy the IPA file to your project directory\n2. Run: npm run ota-host:dev\n3. The server will be available at ${serverUrl}\n\nIPA: ${ipaInfo.displayName} v${ipaInfo.version}`,
        [
          {
            text: 'Copy Instructions',
            onPress: () => {
              // In a real implementation, you could copy to clipboard
              console.log('Copy instructions to clipboard');
            }
          },
          { text: 'OK' }
        ]
      );

    } catch (error) {
      console.error('Error starting OTA server:', error);
      setServerState({
        isRunning: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      Alert.alert('Error', 'Failed to start OTA server. Please try again.');
    }
  }, [extractIPAMetadata]);

  const stopOTAServer = useCallback(() => {
    setServerState({ isRunning: false });
    Alert.alert('OTA Server', 'Server stopped. You can manually stop the npm process if it\'s still running.');
  }, []);

  const generateManifest = useCallback(async (ipaInfo: IPAInfo, baseUrl: string) => {
    const manifest = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>items</key>
    <array>
        <dict>
            <key>assets</key>
            <array>
                <dict>
                    <key>kind</key>
                    <string>software-package</string>
                    <key>url</key>
                    <string>${baseUrl}/latest.ipa</string>
                </dict>
            </array>
            <key>metadata</key>
            <dict>
                <key>bundle-identifier</key>
                <string>${ipaInfo.bundleId}</string>
                <key>bundle-version</key>
                <string>${ipaInfo.version}</string>
                <key>kind</key>
                <string>software</string>
                <key>title</key>
                <string>${ipaInfo.displayName}</string>
            </dict>
        </dict>
    </array>
</dict>
</plist>`;

    return manifest;
  }, []);

  const getInstallUrl = useCallback((serverUrl: string) => {
    return `itms-services://?action=download-manifest&url=${encodeURIComponent(`${serverUrl}/manifest.plist`)}`;
  }, []);

  return {
    serverState,
    selectIPAFile,
    startOTAServer,
    stopOTAServer,
    generateManifest,
    getInstallUrl,
  };
};