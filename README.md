# Ripple Messenger 👋

Ripple Messenger is a premium, high-performance universal chat application built with **React Native (Expo)** on the frontend and an **Express.js + MongoDB + WebSocket** backend. It features modern aesthetics, real-time messaging, and an intuitive offline-first simulation.

---

## 🚀 Key Features
- **Local Demo Mode**: Chat locally as two different users (David and Daniel Mercer) by switching perspectives in real-time, complete with local typing indicators and offline mode toggles.
- **Real-Time Online Mode**: Authenticated chat rooms using WebSockets for instant message delivery and real-time typing indicators.
- **Interviewer Quick Login**: Pre-configured interviewer accounts for instant validation:
  - **Hasan** (PIN: `4039`)
  - **Bashar** (PIN: `1234`)
- **Friend Discovery & Requests**: Explore teammates, send chat requests, cancel pending requests, and accept or decline incoming requests.
- **Rich Media & Waveforms**: Supports image sharing (via Cloudinary storage fallback) and interactive voice message waveforms.
- **Premium UI Design**: Built with high-end clean layout design, smooth transitions, custom splash animations, and dark/light color schemes.

---

## 📁 Repository Structure
- `/src`: The React Native / Expo application files.
  - `/src/app`: Route screens (Expo Router).
  - `/src/components`: Reusable premium components (ChatRoom, AuthScreen, DashboardView, etc.).
  - `/src/constants`: Global configurations and mock data.
- `/server`: Express.js WebSocket and HTTP API server.
  - `index.js`: Main backend and WebSocket entry point.

---

## 🛠️ Step-by-Step Setup Guide

Follow these steps to run the application locally on your machine.

### Step 1: Clone and Prepare Environment
1. Clone the repository to your local system.
2. Ensure you have **Node.js** (v18 or higher) and **Bun** (recommended) or **npm** installed.

---

### Step 2: Backend Server Setup
The backend handles database management, user verification, file uploads, and WebSocket events.

1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Install the backend dependencies:
   ```bash
   bun install
   # OR: npm install
   ```
3. Configure the environment variables. Create a `.env` file inside the `server/` directory:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   PORT=3000
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```
4. Start the backend server:
   ```bash
   bun index.js
   # OR: node index.js
   ```
   *Note: Upon startup, the database seeder will run and automatically register the default users and interviewer accounts (`hasan` & `bashar`) in the MongoDB collection.*

---

### Step 3: Frontend Expo App Setup
The mobile application runs on Android, iOS, and the web.

1. Navigate back to the root of the project:
   ```bash
   cd ..
   ```
2. Install frontend dependencies:
   ```bash
   bun install
   # OR: npm install
   ```
3. Configure target endpoints. Ensure [src/constants/config.ts](file:///g:/ripple-app/src/constants/config.ts) is configured to connect to your backend:
   ```typescript
   export const API_URL = "http://localhost:3000";
   export const WS_URL = "ws://localhost:3000";
   ```
   *(For testing on physical mobile devices, replace `localhost` with your machine's local IP address).*
4. Start the Expo development server:
   ```bash
   bun expo start
   # OR: npx expo start
   ```

---

## 📱 Running and Testing the App
Once the Metro Bundler is running, you can open the application using one of the following methods:

- **Web Browser**: Press `w` in your terminal to run the web build in your browser.
- **Android Emulator**: Open Android Studio's virtual device and press `a` in your terminal.
- **iOS Simulator (macOS)**: Press `i` in your terminal.
- **Physical Device**: Download the **Expo Go** app on your phone, and scan the QR code displayed in the terminal.

---

## 🔒 Verification & Authentication Credentials
When entering **Real Mode** from the welcome screen, you can sign in using these pre-seeded profiles:

| Account Name | Username | PIN | Role |
| :--- | :--- | :--- | :--- |
| **Hasan** | `hasan` | `4039` | Interviewer Account |
| **Bashar** | `bashar` | `1234` | Interviewer Account |

*(You can also register a new account on-the-fly using the registration form).*

---

## ⚡ Production Builds
To build a release-ready APK/AAB or IPA using EAS (Expo Application Services):

1. Log in to your Expo account:
   ```bash
   npx eas login
   ```
2. Build for Android (creates an optimized AAB for production):
   ```bash
   eas build -p android --profile production
   ```
   *(Production builds are configured to run with **Hermes Engine** enabled and **ProGuard** code shrinking active to minimize binary size).*
