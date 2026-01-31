# Mobile App & Remote Access Guide

## 1. Remote Access (Any Wi-Fi / Internet)
The system now includes a built-in "Tunnel" feature that allows you to access your POS from anywhere, even if you are not on the same Wi-Fi.

1. Start the Desktop App (EXE or `npm start`).
2. Go to the **Dashboard**.
3. Scroll down to the **Mobile Access** section.
4. Scan the **"Any Wi-Fi / Internet"** QR Code with your phone.
   - This works even on 4G/5G data!

## 2. Building the Android APK
You can build a real Android App (.apk) for your POS.

### Prerequisites
- Install **Android Studio** (Required for building APKs).
- Ensure you have the Android SDK installed.

### Steps to Build
1. Open a terminal in the project folder.
2. Run:
   ```bash
   npx cap open android
   ```
3. This will open Android Studio.
4. Wait for Gradle to sync.
5. Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
6. Once finished, transfer the APK to your phone and install it.

### How the App Works
- When you open the App on your phone, it will ask for a **Server URL**.
- Scan the QR code from the Desktop Dashboard (or type the URL manually).
- The App will connect to your Desktop and remember the setting.
