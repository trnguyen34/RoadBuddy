# Frontend 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```
   also, sign up for an Expo account

   for iOS: install Xcode via Apple Store and install command line tools (in settings -> locations)
   then install:
   ```bash
   brew update
   brew install watchman
   ```
   ESLint should already be part of the dev packages (installed via npm install)

   

2. Start the app

   ```bash
    npx expo start
   ```

   for iOS emulator (requires Xcode)
   ```bash
      npx expo run:ios 
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

If not updated, the base-url.tsx must be updated to be the same as the IP address in the server
