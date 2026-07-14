# Professional UI/UX Redesign Prompt for "Tousalni" (توصلني) Delivery App

## Context
I have a React Native (Expo) delivery app called "Tousalni" (توصلني) for the Algerian market. The app connects delivery drivers with customers. The backend (Firebase) and all business logic work perfectly. I need a **complete UI/UX redesign** of all screens to make the app look **modern, professional, and polished** — similar to apps like Careem, Uber, Talabat, or HungerStation.

**IMPORTANT**: Only redesign the UI/styling/visual components. Do NOT change the business logic, Firebase calls, state management, navigation structure, or screen functionality. Keep all existing functionality intact.

## Tech Stack (DO NOT CHANGE)
- React Native with Expo SDK 54
- React Navigation (Native Stack)
- All screens are in `src/screens/`
- Styles are in the same file as the component (inline StyleSheet)
- Colors are defined in `src/constants/wilayas.js` as `COLORS` object
- All text is in Arabic (RTL layout)
- No external UI libraries currently installed (you may add `react-native-reanimated` for animations, and Expo-compatible packages only)

## Design Language — Target These Apps for Inspiration
- **Careem** (ride-hailing): Clean cards, bold status badges, smooth gradients
- **Uber Eats / Talabat**: Food/item selection cards, category grids, delivery tracking UI
- **HungerStation**: Professional modal sheets, payment flow, clean typography

## Screen List to Redesign

### 1. SplashScreen
- Show the app logo/name "توصلني" with a smooth animation
- Gradient background (use app primary gradient)
- Animated loading indicator at the bottom
- Keep it minimal and elegant

### 2. LoginScreen
- Clean card-based layout
- Email/password inputs with floating labels or icons inside inputs
- "Forgot password?" link styled nicely
- Login button with gradient or solid color, slight shadow
- Register link at bottom
- App logo at the top

### 3. RegisterScreen
- Multi-step form (3 steps) — keep the step indicator but make it look professional (numbered circles with progress line)
- Clean input fields with icons (email, phone, lock, map pin, etc.)
- Wilaya picker should be a searchable dropdown or modal list
- Vehicle type picker for drivers should use icons (motorcycle, car, bicycle, walking)
- Back/Next/Register buttons at bottom

### 4. CustomerDashboard
- **Header**: Gradient header with user greeting, name, wilaya, and a logout icon button (not text)
- **Subscription expired banner**: Modern alert card with icon, subtle gradient, tap to subscribe
- **Stats row**: Three stat cards in a horizontal row with icons, numbers, and labels — use subtle colored backgrounds
- **New delivery request button**: Large prominent CTA button with icon, gradient background, rounded corners
- **Available drivers section**: Driver cards with avatar circle (first letter), name, phone icon, vehicle icon — clean card with elevation
- **Recent requests section**: Request cards with colored status badge (pill shape), pickup → delivery address with arrows
- **Active subscription banner**: Green success card
- **Subscription modal**: Bottom sheet style modal with plan cards (monthly/yearly) — each card shows price, duration, features with checkmarks
- **Payment modal**: Bottom sheet with CCP info in a styled card, image upload area (dashed border), payment history list

### 5. DriverDashboard
- **Header**: Gradient header with driver name, online/offline toggle switch
- **Online status section**: Styled card showing online/offline status with colored indicator dot
- **Stats row**: Three stat items (available, active, completed) with numbers and labels
- **Tab bar**: Styled tab bar with underline indicator for "Available" and "My Requests"
- **Pending request cards**: Customer avatar, name, phone, delivery fee badge, pickup/delivery addresses, "Accept" button
- **My requests cards**: Status badge (colored pill), customer info, address section, action buttons (update status + chat)
- **Empty states**: Centered icon + text for no results

### 6. AdminDashboard
- **Header**: Gradient with admin name
- **Tab bar**: 4 tabs (Overview, Users, Payments, Requests) with icons
- **Overview tab**: Stats grid (2x3) with colored background cards, each with icon, number, label. Settings button at bottom
- **Users tab**: Filter chips (All, Customers, Drivers) at top. User list with avatar, name, role badge, phone, active/inactive toggle switch
- **Payments tab**: Pending payments section (highlighted), all payments list. Each payment card shows user, amount, plan type, approve/reject buttons (green/red)
- **Requests tab**: FlatList of request cards with status badge, fee, customer/driver info
- **Settings modal**: Bottom sheet with subscription prices (monthly/yearly) and CCP details (account number, key, name, wilaya) — clean form inputs
- **User detail modal**: Bottom sheet with large avatar, name, role, details rows, delete button

### 7. NewDeliveryRequest
- **Header**: Gradient header with back arrow and title
- **Pickup address section**: Text input + "Use my location" button (dashed border, location icon)
- **Delivery address section**: Same style as pickup
- **Item type selection**: Grid of icon cards (3 columns) — food 🍔, clothes 👕, documents 📄, electronics 📱, groceries 🛒, medicine 💊, other 📦 — selected card highlighted with border
- **Item description**: Multiline text input
- **Item price**: Numeric input with "دج" suffix
- **Notes**: Multiline text input
- **Delivery fee card**: Shows calculated fee with gradient background
- **Submit button**: Large rounded button with gradient, shadow, and loading state

### 8. SubscriptionScreen
- **Header**: Gradient with back arrow
- **Current plan card**: If active, show plan name and expiry date in a styled card
- **Plan selection**: Two large plan cards (monthly/yearly) with border highlight on selection, "Save X%" badge on yearly
- **Plan card content**: Icon, name, price (large number), duration, feature list with checkmarks
- **Payment section** (appears when plan selected): CCP info card, image upload area, submit button
- **Payment history**: List of past payments with status badges

### 9. ChatScreen
- **Header**: Gradient header with back arrow and other user's name
- **Messages area**: ScrollView with chat bubbles — sent messages on right (primary color), received on left (white with shadow)
- **Message bubble**: Rounded corners, text, timestamp below
- **Input area**: Text input with rounded corners + send button (circle with arrow icon)

### 10. ChatListScreen
- **Header**: Gradient with back arrow and "المحادثات" title
- **Chat cards**: Each card shows avatar circle, other user's name, last message preview (1 line), timestamp on the right
- **Empty state**: Large icon + "No chats yet" message

## Color Palette (update COLORS in wilayas.js)
```
Primary: #1E88E5 (vibrant blue)
Primary Dark: #1565C0
Primary Light: #BBDEFB
Accent: #FF6D00 (orange for CTAs)
Success: #43A047
Error: #E53935
Warning: #FB8C00
Background: #F5F7FA (light gray-blue)
Surface/Card: #FFFFFF
Text: #1A1A2E (dark navy)
Text Secondary: #6B7280
Border: #E5E7EB
White: #FFFFFF
Grey: #9CA3AF
```

## Typography Guidelines
- **App name / Large headings**: Bold, 22-28px
- **Section titles**: Bold, 18-20px
- **Card titles**: SemiBold, 15-16px
- **Body text**: Regular, 14-15px
- **Small labels / timestamps**: Regular, 11-12px
- Use system font (default is fine for Arabic)

## Component Patterns to Follow
1. **Cards**: White background, borderRadius: 16-20, elevation: 3-4, padding: 16-20
2. **Buttons**: borderRadius: 12-16, paddingVertical: 14-18, bold text, gradient or solid color
3. **Inputs**: White background, borderRadius: 12-14, borderWidth: 1, borderColor: border color, paddingVertical: 14
4. **Status badges**: Pill shape (borderRadius: 20), small padding, white text, colored background
5. **Modals**: Bottom sheet style (justifyContent: 'flex-end'), rounded top corners (borderRadius: 24), white background
6. **Avatars**: Circular, background color = primary, white first-letter text
7. **Icons**: Use emoji or Unicode characters (already in use) — keep them, just make the surrounding layout more professional
8. **Empty states**: Centered layout with large icon (50-60px), bold message text, subtle gray subtext
9. **Refresh**: Pull-to-refresh on all list screens
10. **Safe area**: paddingTop: 50 for status bar (already handled)

## Gradient Usage
- Use `LinearGradient` from `expo-linear-gradient` for headers and CTA buttons
- Header gradient: `['#1E88E5', '#1565C0']` (top to bottom)
- CTA button gradient: `['#FF6D00', '#FF8F00']` (left to right or top to bottom)
- Success button gradient: `['#43A047', '#66BB6A']`

## Important Constraints
1. **DO NOT change any Firebase logic, API calls, or data flow**
2. **DO NOT change navigation structure or screen names**
3. **DO NOT remove any functionality** — all features must remain
4. **All text stays in Arabic** — this is an RTL app
5. **All imports must stay the same** — only change the JSX return and StyleSheet
6. **Keep the same file structure** — each screen is a single file with inline styles
7. **Keep the same state management** (useState, useEffect, useRef, useContext)
8. **If adding expo-linear-gradient**, make sure it's compatible with Expo SDK 54
9. **Test that the code compiles** — no syntax errors, no missing variables
10. **Keep all props passed to child components intact**

## Output Format
For each file, provide the **complete updated file content** — do not provide partial code or snippets. I need to copy-paste the full file.

Start with the screens in this order:
1. `src/constants/wilayas.js` (update COLORS object)
2. `src/screens/SplashScreen.js`
3. `src/screens/LoginScreen.js`
4. `src/screens/RegisterScreen.js`
5. `src/screens/CustomerDashboard.js`
6. `src/screens/DriverDashboard.js`
7. `src/screens/AdminDashboard.js`
8. `src/screens/NewDeliveryRequest.js`
9. `src/screens/SubscriptionScreen.js`
10. `src/screens/ChatScreen.js`
11. `src/screens/ChatListScreen.js`
