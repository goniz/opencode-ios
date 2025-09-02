export default {
  expo: {
    name: process.env.EXPO_PUBLIC_APP_NAME || "opencode-mobile",
    slug: "opencode-mobile",
    version: "1.6.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "opencodemobile",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: process.env.EXPO_PUBLIC_BUNDLE_ID || "com.goniz.opencodemobile",
      infoPlist: {
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true,
          NSExceptionDomains: {
            localhost: {
              NSExceptionAllowsInsecureHTTPLoads: true,
              NSExceptionMinimumTLSVersion: "1.0",
              NSExceptionRequiresForwardSecrecy: false
            }
          }
        },
        ITSAppUsesNonExemptEncryption: false,
        NSCameraUsageDescription: "This app uses the camera to capture images for chat messages.",
        NSPhotoLibraryUsageDescription: "This app accesses your photo library to select images for chat messages.",
        NSPhotoLibraryAddUsageDescription: "This app saves images to your photo library.",
        NSAppleMusicUsageDescription: "This app accesses media library for clipboard functionality."
      }
    },
    android: {
      package: process.env.EXPO_PUBLIC_BUNDLE_ID || "com.goniz.opencodemobile",
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      permissions: [
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE"
      ]
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff"
        }
      ],
      "expo-web-browser",
      "expo-secure-store",
      [
        "./plugins/addSPMDependenciesToMainTarget.js",
        {
          version: "0.8.0",
          repositoryUrl: "https://github.com/apple/swift-nio-ssh.git",
          repoName: "swift-nio-ssh",
          productName: "NIOSSH"
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {},
      eas: {
        projectId: "98dafe4d-c4a9-4988-b49c-3c6a01228764"
      }
    },
    owner: "goniz"
  }
};