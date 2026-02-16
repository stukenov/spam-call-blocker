# Spam Call Blocker

A powerful React Native Android application for blocking unwanted calls, including micro-calls (beacon calls) used by spammers.

## Features

- **Block Unknown Numbers** - Automatically blocks calls from numbers not in your contacts
- **Micro-Call Protection** - Blocks short calls (less than 3 seconds) used as tracking beacons
- **Blacklist Management** - Manually add numbers to your blocklist
- **User-Friendly Interface** - Simple settings and statistics dashboard
- **Auto-Start** - Automatically starts after device reboot
- **Background Operation** - Continuous protection with minimal performance impact
- **Privacy-Focused** - All data stays on your device, no internet connection required

## Requirements

- **Android 7.0 (API 24) or higher**
- Permissions for contacts access and call management
- Battery optimization should be disabled for the app for best performance

## Technology Stack

- **React Native** with Expo
- **Expo Router** for navigation
- **TypeScript** for type safety
- **Android Native Modules** for call blocking functionality
- **AsyncStorage** for local data persistence

## Installation

### Prerequisites

```bash
# Install dependencies
npm install
```

### Development Mode

```bash
# Run on Android device/emulator
npm run android

# Or using Expo
npx expo start --android
```

### Build APK

```bash
# Build for Android
npx expo build:android
```

## Required Permissions

The app requires the following Android permissions:

### Critical Permissions:
- **READ_CONTACTS** - To check incoming numbers against your contacts
- **READ_PHONE_STATE** - To monitor incoming calls
- **CALL_PHONE** - To manage and block unwanted calls
- **READ_CALL_LOG** - To analyze call history

### Additional Permissions:
- **SYSTEM_ALERT_WINDOW** - To show blocking notifications
- **FOREGROUND_SERVICE** - For continuous background protection

## How to Use

1. **First Launch**
   - Grant all required permissions
   - Enable the call blocker on the main screen

2. **Configure Blocking**
   - Enable blocking of unknown numbers
   - Activate micro-call protection
   - Configure notifications

3. **Manage Blacklist**
   - Add numbers manually
   - Block contacts from your phone book
   - View blocked call history

## Architecture

### Native Android Modules:
- `CallBlockerModule` - Main blocking module
- `CallBlockingService` - Background monitoring service
- `CallScreeningService` - Call screening service (Android 10+)
- `BootReceiver` - Auto-start after device reboot

### React Native Components:
- `useCallBlocker` - Hook for managing call blocking
- `usePermissions` - Permission management
- Screens: Home, Permissions, Blacklist

## Privacy

- The app works **completely offline**
- Your contacts are **never transmitted** over the internet
- All data is stored **only on your device**
- No analytics or tracking

## Android Version Support

| Android Version | API Level | Support | Features |
|----------------|-----------|---------|----------|
| Android 7.0+   | 24+       | ✅ Full | Basic blocking |
| Android 9.0+   | 28+       | ✅ Full | Enhanced call management |
| Android 10+    | 29+       | ✅ Full | CallScreeningService |

## Known Limitations

- **Android Only** - iOS does not provide API for call blocking
- **Some ROMs** may block the service (MIUI, ColorOS)
- **Permissions** may require manual configuration in system settings

## Troubleshooting

### Blocking Not Working:
1. Check all permissions in Android settings
2. Disable battery optimization for the app
3. Ensure the service is running (green status indicator)

### Auto-Start Not Working:
1. Add the app to auto-start (MIUI, EMUI)
2. Disable "Smart Battery Saver"
3. Allow background operation

### Contacts Not Loading:
1. Grant contacts access permission
2. Restart the application
3. Verify contacts exist in phone book

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues:
- Create an Issue in the repository
- Describe the problem in detail
- Include your device model and Android version

---

**Note:** This application is designed to protect against spam and unwanted calls. Use responsibly and in accordance with local laws.
