# Prompt كامل لبناء تطبيق "توصلني" (Tousalni) - تطبيق توصيل للجزائر

## ملخص المشروع
تطبيق موبايل للتحقق من هوية سائقي التوصيل وربطهم بالعملاء في الجزائر. الاسم **"توصلني"** (Tousalni). يعمل على Android و iOS باستخدام React Native (Expo) مع Firebase كخادم.

## التقنيات
- **Expo SDK 54** (React Native 0.81.5, React 19.1.0)
- **Firebase v10**: Authentication + Firestore (بدون Storage — الصور تُخزن كـ base64)
- **React Navigation 7** (Native Stack)
- **Expo packages**: expo-location, expo-image-picker, expo-file-system, expo-font, expo-status-bar
- **react-native-reanimated** + **react-native-gesture-handler** + **react-native-screens** + **react-native-safe-area-context**
- **Android package**: `com.tousalni.app`
- **EAS Build**: profile `preview` مع `distribution: internal`

## حساب الأدمن
- **Email**: `mohamedyakhou40@gmail.com`
- **Password**: `052307My`
- عند تسجيل الدخول بهذا الإيميل، الكود يتحقق تلقائياً ويعيّن الدور `admin`

## هيكل المجلدات
```
delivery-app/
├── App.js                          # Entry point مع ErrorBoundary
├── app.json                        # Expo config
├── babel.config.js                 # MUST include 'react-native-reanimated/plugin'
├── package.json
├── eas.json
├── firebase.json                   # Firebase deploy config
├── firestore.rules                 # Security rules
├── firestore.indexes.json          # Composite indexes
├── assets/
│   ├── icon.png                    # App icon (blue circle with package)
│   ├── adaptive-icon.png           # Android adaptive icon (transparent foreground)
│   └── splash.png                  # Splash screen image
└── src/
    ├── navigation/
    │   └── AppNavigator.js         # Stack Navigator مع AuthProvider
    ├── screens/
    │   ├── SplashScreen.js         # شاشة البداية مع "توصلني"
    │   ├── LoginScreen.js          # تسجيل الدخول + نسيت كلمة المرور
    │   ├── RegisterScreen.js       # تسجيل جديد (3 خطوات)
    │   ├── CustomerDashboard.js    # لوحة تحكم العميل
    │   ├── DriverDashboard.js      # لوحة تحكم السائق
    │   ├── AdminDashboard.js       # لوحة تحكم الأدمن
    │   ├── NewDeliveryRequest.js   # طلب توصيل جديد
    │   ├── SubscriptionScreen.js   # شاشة الاشتراك
    │   ├── ChatScreen.js           # محادثة فردية
    │   └── ChatListScreen.js       # قائمة المحادثات
    ├── services/
    │   ├── firebase.js             # Firebase config + init
    │   ├── auth.js                 # كل خدمات المصادقة + Firestore
    │   ├── delivery.js             # خدمات طلبات التوصيل
    │   ├── payment.js              # خدمات الدفع (base64)
    │   ├── chat.js                 # خدمات المحادثات
    │   └── AuthContext.js          # React Context للمصادقة
    ├── constants/
    │   └── wilayas.js              # 58 ولاية جزائرية + ثوابت
    ├── utils/
    │   └── helpers.js              # دوال مساعدة
    └── components/
        └── ErrorBoundary.js        # مكون ل.catch الأخطاء
```

---

## 1. شاشة البداية (SplashScreen)
- خلفية زرقاء `#2196F3`
- دائرة بيضاء بداخلها أيقونة 📦
- نص **"توصلني"** بالعربي بخط عريض 32px
- نص **"توصيل سريع وآمن"** تحته
- شريط تحميل متحرك (شريط أبيض على خلفية شفافة)
- بعد **2.5 ثانية**: يتحقق من `auth.currentUser`
  - لو مستخدم مسجل → يجلب بياناته من Firestore ويذهب للوحة التحكم حسب الدور
  - لو لا يوجد → يذهب لشاشة تسجيل الدخول
- الألوان: `COLORS.primary` = `#2196F3`, `COLORS.primaryLight` = `#BBDEFB`, `COLORS.white` = `#FFFFFF`

---

## 2. شاشة تسجيل الدخول (LoginScreen)
- **الheader**: دائرة زرقاء بداخلها 📦 + "مرحباً بك" + "سجّل دخولك للمتابعة"
- **النموذج**:
  - حقل البريد الإلكتروني (email-pad, dir="ltr")
  - حقل كلمة المرور مع زر إظهار/إخفاء (👁️/🙈)
  - زر "تسجيل الدخول" — عند الضغط:
    1. يتحقق أن الحقول ليست فارغة
    2. يستدعي `loginUser(email, password)`
    3. لو نجح → ينتقل حسب الدور (AdminDashboard / DriverDashboard / CustomerDashboard)
    4. لو فشل → Alert برسالة الخطأ
  - **"نسيت كلمة المرور؟"** — يستدعي `sendPasswordResetEmail(auth, email)` مع التحقق من وجود الإيميل أولاً
  - فاصل "أو"
  - زر "إنشاء حساب جديد" → ينتقل لشاشة التسجيل
- **الألوان**: خلفية `COLORS.background` (`#F5F5F5`)، النموذج أبيض مع ظل، الزر الرئيسي `COLORS.primary`

---

## 3. شاشة التسجيل (RegisterScreen) — 3 خطوات
### الخطوة 1: اختيار نوع الحساب
- بطاقة "عميل" (👤) — "أحتاج إلى توصيل"
- بطاقة "سائق توصيل" (🚗) — "أريد تقديم خدمة التوصيل"
- كل بطاقة فيها radio button
- زر "التالي" (معطل لو ما اختار شي)

### الخطوة 2: المعلومات الشخصية
- الاسم الكامل (نص)
- البريد الإلكتروني (email, dir="ltr")
- رقم الهاتف (phone-pad, maxLength=10, dir="ltr")
- **اختيار الولاية**: زر يفتح Modal مع:
  - حقل بحث ي filtre بالعربي أو الإنجليزي أو الرقم
  - FlatList بـ 58 ولاية جزائرية (id, name عربي, nameEn)
  - عند الاختيار يغلق الـ Modal
- **نوع المركبة** (للسائق فقط):
  - 🏍️ دراجة نارية (motorcycle)
  - 🚗 سيارة (car)
  - 🚲 دراجة هوائية (bicycle)
  - 🚶 مشي (walking)
- أزرار "السابق" و "التالي" مع validation

### الخطوة 3: كلمة المرور + ملخص
- حقل كلمة المرور (6 أحرف على الأقل)
- حقل تأكيد كلمة المرور
- **بطاقة ملخص** تبين: النوع، الاسم، الولاية، المركبة (إن وُجدت)
- زر "إنشاء الحساب" — يستدعي `registerUser()` وعند النجاح ينتقل للـ Login

### Validation:
- البريد: regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- الهاتف: regex `/^(05|06|07)\d{8}$/`
- السائق لازم يختار نوع المركبة
- كلمة المرور ≥ 6 أحرف
- المطابقة بين كلمة المرور وتأكيدها

---

## 4. لوحة تحكم العميل (CustomerDashboard)

### Header:
- خلفية زرقاء `COLORS.primary`
- "مرحباً بك" + اسم المستخدم + "رقم الولاية - اسم الولاية"
- زر "خروج" مع تأكيد

### المحتوى (ScrollView مع RefreshControl):

#### بانر الاشتراك (لو منتهي):
- ⚠️ + "اشتراكك منتهي أو غير مفعّل" + "اشترك الآن"
- عند الضغط → يفتح Modal اختيار الباقة

#### إحصائيات (3 بطاقات في صف):
- عدد السائقين المتاحين
- عدد الطلبات الحديثة
- عدد المحادثات (قابل للضغط → ChatList)

#### زر "طلب توصيل جديد":
- 📦 + "طلب توصيل جديد" + "أرسل طلبك الآن" + سهم
- → ينتقل لـ NewDeliveryRequest

#### قسم "السائقون المتاحون":
- لكل سائق: دائرة بحرف الاسم + الاسم + رقم الهاتف + نوع المركبة
- زر "اتصال" → `Linking.openURL('tel:...')`
- لو ما فيش سائقين: 🚗 + "لا يوجد سائقون متاحون حالياً"

#### قسم "الطلبات الحديثة":
- لكل طلب: badge الحالة (ملون) + "من عنوان → إلى عنوان"
- statuses: pending(برتقالي), accepted(أزرق), picked_up(بنفسجي), in_transit(كحلي), delivered/completed(أخضر), cancelled(أحمر)

#### بانر الاشتراك النشط (لو موجود):
- ✅ + اسم الباقة + تاريخ الانتهاء

### Modal اختيار الباقة:
- بطاقة "اشتراك شهري" — السعر + "30 يوم"
- بطاقة "اشتراك سنوي" — السعر + "365 يوم"

### Modal الدفع CCP:
- **بيانات CCP**: رقم الحساب، المفتاح، الاسم، الولاية (من settings في Firestore)
- **المبلغ المطلوب**
- **رفع صورة الإيصال**: expo-image-picker → يتحول لـ base64 عبر expo-file-system
- **سجل الدفعات** للمستخدم
- زر "إرسال طلب الدفع"

---

## 5. لوحة تحكم السائق (DriverDashboard)

### Header (خلفية `COLORS.primaryDark`):
- "مرحباً" + اسم السائق + زر خروج
- **مفتاح التبديل (Switch)**: "متاح للتوصيل" / "غير متاح"
  - عند التفعيل: يطلب صلاحية الموقع ويبدأ `Location.watchPositionAsync` (accuracy: High, distanceInterval: 100m)
  - عند التعطيل: يوقف الـ watcher
- إحصائيات: عدد الطلبات المتاحة / النشطة / المكتملة

### تبويبان:
#### "متاحة" — طلبات التوصيل المعلقة في الولاية
- لكل طلب: دائرة بحرف اسم العميل + الاسم + رقم الهاتف + رسوم التوصيل (badge أخضر)
- عناوين الاستلام والتوصيل
- زر "قبول الطلب" مع تأكيد

#### "طلباتي" — طلباتي النشطة (لا تشمل المكتملة/الملغاة)
- لكل طلب: معلومات العميل + badge الحالة + عناوين
- **زر تحديث الحالة** (التالي فقط):
  - accepted → "تم الاستلام" (picked_up)
  - picked_up → "في الطريق" (in_transit)
  - in_transit → "تم التوصيل" (delivered)
- **زر 💬** → يبدأ محادثة مع العميل (createChat → ChatScreen)

### Firestore indexes المطلوبة:
- `delivery_requests`: `(wilaya ASC, status ASC, createdAt DESC)`
- `delivery_requests`: `(driverId ASC, createdAt DESC)`
- `users`: `(role ASC, wilaya ASC, isActive ASC)`

---

## 6. لوحة تحكم الأدمن (AdminDashboard)

### Header (خلفية `#1565C0`):
- "لوحة التحكم" + "مرحباً [الاسم]" + زر خروج

### 4 تبويبات:

#### 📊 نظرة عامة
- شبكة إحصائيات (6 بطاقات ملونة):
  - إجمالي المستخدمين (أزرق)
  - سائقين مسجلين (أخضر)
  - عملاء (برتقالي)
  - مشتركين (بنفسجي)
  - إجمالي الطلبات (أحمر)
  - دفعات معلقة (أصفر)
- زر "⚙️ إعدادات التطبيق" → Modal الإعدادات

#### 👥 المستخدمين
- **شريطفلتر**: الكل / عملاء / سائقين
- FlatList بقائمة المستخدمين:
  - دائرة بحرف الاسم + الاسم + الدور + الولاية + رقم الهاتف
  - **Switch** لتفعيل/تعطيل المستخدم (ما عدا الأدمن)
- عند الضغط على مستخدم → **Modal تفاصيل**:
  - صورة أكبر + الاسم + الدور
  - البريد، الهاتف، الولاية، حالة الاشتراك، حالة الحساب
  - زر "حذف المستخدم" (ما عدا الأدمن)

#### 💰 الدفعات
- **دفعات معلقة** (إن وُجدت): لكل دفعة:
  - اسم المستخدم + المبلغ + نوع الباقة + التاريخ
  - صورة الإيصال (إن وُجدت)
  - زرا "✓ موافقة" و "✕ رفض"
  - عند الموافقة: يفعّل اشتراك المستخدم (approvePayment)
  - عند الرفض: يرفض الدفعة (rejectPayment)
- **كل الدفعات**: قائمة بكل الدفعات مع حالة

#### 📦 الطلبات
- FlatList بكل طلبات التوصيل مع: badge الحالة + الرسوم + معلومات العميل/السائق + العناوين

### Modal الإعدادات:
- **أسعار الاشتراك**:
  - الاشتراك الشهري (دج) — حقل رقمي
  - الاشتراك السنوي (دج) — حقل رقمي
- **بيانات CCP**:
  - رقم الحساب — حقل رقمي
  - المفتاح (Clé) — حقل رقمي، maxLength 3
  - الاسم الكامل
  - الولاية
- زر "💾 حفظ الإعدادات" → `updateAdminSettings(settings)` مع `setDoc` و `merge: true`

---

## 7. طلب توصيل جديد (NewDeliveryRequest)
- زر رجوع →
- **عنوان الاستلام**: حقل نص + زر "📍 استخدم موقعي الحالي" (expo-location)
- **عنوان التوصيل**: حقل نص + زر "📍 استخدم موقعي الحالي"
- **نوع الشيء** (7 خيارات بتصميم شبكي 3 أعمدة):
  - 🍔 طعام (food)
  - 👕 ملابس (clothes)
  - 📄 وثائق (documents)
  - 📱 إلكترونيات (electronics)
  - 🛒 بقالة (groceries)
  - 💊 أدوية (medicine)
  - 📦 أخرى (other)
- **وصف الشيء**: textarea
- **قيمة الشيء** (اختياري): حقل رقمي
- **ملاحظات إضافية**: textarea
- **رسوم التوصيل المقدرة**: تظهر لو تحديد الموقعين (الرسوم = 200 + 50×المسافة بالكم)
- زر "إرسال طلب التوصيل" → `createDeliveryRequest()`

### حساب المسافة:
```js
// Haversine formula
const R = 6371; // Earth radius in km
// Calculate distance from lat/lng differences
// Fee = 200 + (distance * 50) DZD
```

---

## 8. شاشة الاشتراك (SubscriptionScreen)
- زر رجوع →
- **اشتراكك الحالي** (لو موجود): الباقة + تاريخ الانتهاء
- **اختيار الباقة**:
  - 📅 اشتراك شهري — السعر + "30 يوم" + المميزات
  - 📅 اشتراك سنوي — السعر + "365 يوم" + المميزات + بانر توفير %
- **قسم الدفع CCP** (يظهر بعد اختيار الباقة):
  - بيانات CCP للتحويل
  - زر رفع صورة الإيصال
  - معاينة الصورة
  - زر "إرسال طلب الدفع (المبلغ دج)"
- **سجل الدفعات**

---

## 9. شاشة المحادثة (ChatScreen)
- **Header**: زر رجوع → + اسم الطرف الآخر
- **الرسائل** (ScrollView):
  - رسالة المستخدم: خلفية زرقاء، يمين
  - رسالة الطرف الآخر: خلفية بيضاء، يسار
  - كل رسالة فيها: النص + الوقت (HH:MM)
  - `onSnapshot` للتحديث اللحظي
- **حقل الإدخال**: في الأسفل، حقل نص + زر "إرسال"
- عند الإرسال: `sendMessage()` → يخزن في `chats/{chatId}/messages` + يحدّث آخر رسالة في الوثيقة الرئيسية

---

## 10. قائمة المحادثات (ChatListScreen)
- **Header**: زر رجوع → + "المحادثات"
- **FlatList** بقائمة المحادثات:
  - دائرة بحرف اسم الطرف الآخر + اسمه + آخر رسالة + الوقت
  - `getUserChats()` يستمع لمحادثتين ( كـ customer و كـ driver) دفعة واحدة
  - عند الضغط → ChatScreen
- **حالة فارغة**: 💬 + "لا توجد محادثات بعد" + "ستظهر هنا المحادثات مع السائقين"

---

## Firebase Firestore Collections

### `users/{uid}`
```json
{
  "uid": "string",
  "email": "string",
  "fullName": "string",
  "phone": "string",
  "wilaya": "string (اسم الولاية بالعربي)",
  "role": "admin | driver | customer",
  "profileImage": "string",
  "createdAt": "ISO date string",
  "isActive": true,
  "subscription": {
    "planId": "monthly | yearly",
    "planName": "string",
    "price": number,
    "duration": number,
    "startDate": "ISO date",
    "expiryDate": "ISO date",
    "isActive": true
  } | null,
  "vehicleType": "motorcycle | car | bicycle | walking" | null,
  "currentLocation": {
    "latitude": number,
    "longitude": number,
    "timestamp": "ISO date"
  } | null
}
```

### `delivery_requests/{id}`
```json
{
  "customerId": "uid",
  "customerName": "string",
  "customerPhone": "string",
  "driverId": "uid | null",
  "driverName": "string | null",
  "driverPhone": "string | null",
  "pickupAddress": "string",
  "deliveryAddress": "string",
  "pickupLocation": { "latitude": number, "longitude": number },
  "deliveryLocation": { "latitude": number, "longitude": number },
  "itemType": "food | clothes | documents | electronics | groceries | medicine | other",
  "itemDescription": "string",
  "itemPrice": number,
  "deliveryFee": number,
  "status": "pending | accepted | picked_up | in_transit | delivered | completed | cancelled",
  "notes": "string",
  "wilaya": "string",
  "rating": number | undefined,
  "ratingComment": "string" | undefined,
  "createdAt": "ISO date",
  "updatedAt": "ISO date"
}
```

### `payments/{id}`
```json
{
  "userId": "uid",
  "userName": "string",
  "userEmail": "string",
  "userPhone": "string",
  "planType": "monthly | yearly",
  "planDuration": number,
  "amount": number,
  "proofImage": "data:image/jpeg;base64,... (base64)",
  "status": "pending | approved | rejected",
  "adminNote": "string",
  "createdAt": "ISO date",
  "reviewedAt": "ISO date | null"
}
```

### `chats/{id}`
```json
{
  "customerId": "uid",
  "customerName": "string",
  "driverId": "uid",
  "driverName": "string",
  "requestId": "delivery_request id",
  "lastMessage": "string",
  "lastMessageTime": "ISO date",
  "lastMessageBy": "uid",
  "createdAt": "ISO date"
}
```

### `chats/{id}/messages/{id}`
```json
{
  "senderId": "uid",
  "senderName": "string",
  "text": "string",
  "timestamp": "ISO date",
  "read": false
}
```

### `settings/app_settings`
```json
{
  "subscriptionMonthly": { "price": number, "duration": 30 },
  "subscriptionYearly": { "price": number, "duration": 365 },
  "ccp": {
    "accountNumber": "string",
    "key": "string (3 أرقام)",
    "name": "string",
    "wilaya": "string"
  }
}
```

---

## Firestore Composite Indexes المطلوبة
```
1. delivery_requests: customerId ASC, createdAt DESC
2. delivery_requests: driverId ASC, createdAt DESC
3. delivery_requests: wilaya ASC, status ASC, createdAt DESC
4. payments: userId ASC, createdAt DESC
5. payments: status ASC, createdAt DESC
6. users: role ASC, wilaya ASC, isActive ASC
7. delivery_requests: status ASC, createdAt DESC (admin getAllRequests)
```

## Firestore Security Rules
- **users**: authenticated users can read all, write own doc. Admin can delete.
- **delivery_requests**: authenticated users can CRUD. Customer creates, driver accepts/updates.
- **payments**: authenticated users can create + read own. Admin can read all + update.
- **chats**: authenticated users can create + read if participant. Messages: create + read if chat participant.
- **settings**: authenticated users can read. Admin can write.

---

## ثوابت التطبيق
### الألوان
```js
COLORS = {
  primary: '#2196F3',
  primaryDark: '#1976D2',
  primaryLight: '#BBDEFB',
  accent: '#FF9800',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  white: '#FFFFFF',
  black: '#000000',
  error: '#F44336',
  success: '#4CAF50',
  warning: '#FF9800',
  border: '#E0E0E0',
  grey: '#9E9E9E',
}
```

### الدور
```js
USER_ROLES = { ADMIN: 'admin', DRIVER: 'driver', CUSTOMER: 'customer' }
```

### 58 ولاية جزائرية
مرقمة من 1 (أدرار) إلى 58 (النعمة) — كل ولاية لها `id` (رقم) + `name` (عربي) + `nameEn` (إنجليزي)

---

## نموذج الدفع CCP
- العميل يرى بيانات CCP الحساب (من الإعدادات)
- يحول المبلغ عبر CCP banking
- يرفع صورة الإيصال (يتحول لـ base64 ويخزن في Firestore)
- الأدمن يراجع الصورة ويوافق أو يرفض
- عند الموافقة: يُفعّل اشتراك العميل تلقائياً (30 يوم أو 365 يوم)

## حساب رسوم التوصيل
- **الرسوم الأساسية**: 200 دج
- **لكل كم**: 50 دج إضافية
- **الصيغة**: `200 + (المسافة بالكم × 50)`
- المسافة تُحسب بـ Haversine formula من إحداثيات GPS

## تطبيق Firebase (firebase.json)
```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

---

## ملاحظات تقنية مهمة جداً
1. **babel.config.js** لازم يكون فيه `plugins: ['react-native-reanimated/plugin']` — بدونه التطبيق ي crash
2. **App.js** لازم يكون أول import هو `import 'react-native-gesture-handler';`
3. **لا تستخدم Firebase Storage** — الصور تُخزن كـ base64 في Firestore عبر `expo-file-system`
4. **ErrorBoundary** لازم يلف كل شيء في App.js
5. **Firebase init** لازم يكون داخل try-catch مع fallback
6. **`AuthProvider`** لازم يتحقق من `auth` قبل `onAuthStateChanged`
7. **الإشعارات** لا تستخدم — تم حذف `expo-notifications`
8. **app.json** لازم فيه plugins: expo-location, expo-image-picker, expo-font
9. **`react-native-worklets`** مطلوب كـ peer dependency لـ reanimated 4.x
