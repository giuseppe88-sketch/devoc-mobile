# Devoc Mobile

A booking application for developers where developers can register and upload their portfolio, and clients can choose and book developers.

## 🚀 Try Devoc Mobile Instantly with Expo Go

You can experience the app on your own device using Expo Go—no need to access the source code or clone this repository.

### 1. Install Expo Go

- Download [Expo Go](https://expo.dev/expo-go) from the App Store (iOS) or Google Play (Android).

### 2. Open the App

- Open Expo Go on your device.
- Scan the QR code below, or open this link directly in Expo Go:


  ![Expo QR Code](https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://expo.dev/accounts/giuseppe88/projects/devoc-mobile)

> **Note:**  
> - You do **not** need access to the source code to try the app.
> - All features are available for preview via Expo Go.
> - If you encounter any issues, ensure your device is connected to the internet.

---

### ℹ️ About the Source Code

The source code for this project is private. If you are interested in learning more about the implementation or collaborating, feel free to contact me via [GitHub](https://github.com/giuseppe88-sketch).

## Key MVP Features

1. **Auth** – Login/signup with Supabase
2. **Profiles** – Dev profile with skills, availability
3. **Booking Page** – Company picks time slot
4. **Calendar Sync** – Google Calendar event creation
5. **Notifications** – Confirmation + upcoming booking reminders
6. **Admin** (optional) – View/manage bookings

## Project Structure

```
devoc-mobile/
├── App.tsx                 # Main app component
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── src/
│   ├── lib/                # Utility libraries
│   │   └── supabase.ts     # Supabase client configuration
│   ├── navigation/         # Navigation components
│   │   ├── auth-navigator.tsx
│   │   └── main-navigator.tsx
│   ├── screens/            # Screen components
│   │   ├── auth/           # Authentication screens
│   │   │   ├── login-screen.tsx
│   │   │   └── signup-screen.tsx
│   │   ├── developer/      # Developer-specific screens
│   │   │   ├── dashboard-screen.tsx
│   │   │   ├── profile-screen.tsx
│   │   │   ├── availability-screen.tsx
│   │   │   └── bookings-screen.tsx
│   │   └── client/         # Client-specific screens
│   │       ├── dashboard-screen.tsx
│   │       ├── browse-screen.tsx
│   │       └── bookings-screen.tsx
│   ├── stores/             # Zustand stores
│   │   └── auth-store.ts
│   └── types/              # TypeScript type definitions
│       └── index.ts
```

## Tech Stack

- **Framework**: React Native with Expo
- **State Management**: Zustand
- **Authentication**: Supabase
- **Data Fetching**: TanStack Query (react-query)
- **UI Components**: Native components with styled-components
- **Navigation**: React Navigation
- **Calendar**: react-native-calendars
- **Notifications**: Expo Notifications

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a Supabase project and update the credentials in `src/lib/supabase.ts`
4. Start the development server:
   ```
   npm run dev
   ```

## User Flow

### Developer Flow
1. Register & login
2. Set up profile (bio, skills, timezone)
3. Define availability
4. Get notified when booked
5. Confirm or reject bookings
6. See bookings in calendar

### Client Flow
1. Register & login
2. Browse available developers
3. Select one and see available time slots
4. Book a session with optional notes
5. Get booking confirmation
6. Manage bookings

## Database Schema

The application uses Supabase with the following tables:

- **users**: Authentication and user data
- **developers**: Developer profiles
- **clients**: Client profiles
- **availability**: Developer availability settings
- **bookings**: Booking information
- **notifications**: User notifications

## Next Steps

- Implement Google Calendar integration
- Add push notifications
- Create admin dashboard
- Add ratings and reviews system
- Implement payment processing
