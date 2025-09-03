Pod::Spec.new do |s|
  s.name           = 'ExpoSSH'
  s.version        = '1.0.0'
  s.summary        = 'SSH client module for Expo apps using Swift NIO SSH'
  s.description    = 'A Swift-based SSH client module that provides SSH connectivity and command execution capabilities for Expo apps using Apple\'s Swift NIO SSH library'
  s.author         = 'Expo SSH Module'
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '15.1',
    :tvos => '15.1'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_VERSION' => '5.9'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
