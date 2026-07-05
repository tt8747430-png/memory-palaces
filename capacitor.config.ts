import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'app.mindscape.memory',
  appName: 'Mindscape',
  webDir: 'dist',
  ios: {
    // The app manages its own safe-area padding (env(safe-area-inset-*)), so the web
    // view should not add its own automatic content insets on top.
    contentInset: 'never',
  },
}

export default config
