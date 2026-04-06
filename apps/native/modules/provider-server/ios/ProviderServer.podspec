Pod::Spec.new do |s|
  s.name             = 'ProviderServer'
  s.version          = '1.0.0'
  s.summary          = 'Local HTTP provider bridge for Berth AI'
  s.description      = 'Expo module that exposes a local HTTP bridge for on-device inference providers.'
  s.author           = 'OpenAI'
  s.homepage         = 'https://docs.expo.dev/modules/'
  s.platforms        = {
    :ios => '15.1',
    :tvos => '15.1'
  }
  s.source           = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
