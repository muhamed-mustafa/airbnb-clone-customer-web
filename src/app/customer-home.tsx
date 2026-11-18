'use client';

import { preloadSmartImage, SmartImage } from '../components/smart-image';
import { createPortal } from 'react-dom';
import { displayUnitDescription, displayUnitTitle, formatBedrooms, formatDate, formatGuests, formatMoney, formatNumber, formatStayCount, isPreviewUnit, localizeReference } from '../lib/formatting';
import type { CountryCode, getCountries, getCountryCallingCode, parsePhoneNumberFromString } from 'libphonenumber-js';
import { useCallback, useEffect, useId, useMemo, useRef, useState, type FocusEvent, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react';

type Unit = {
  id: string; title: string; description: string; address: string; photos: string[];
  costPerDay: number; country: string; city: string; unitCategory: string;
  roomsCount: number; rating?: number; adultsCount: number; kidsCount: number; hasInternetService: boolean;
  hasKitchen: boolean; hasPrivateGarage: boolean; availability: boolean; isActive?: boolean; version: number;
};
type Booking = {
  id: string; unit?: string | { title?: string; photos?: string[] }; checkIn: string; checkOut: string;
  totalAmount: number; status: string; guest?: string | { name?: string }; host?: string | { name?: string };
  adultsCount?: number; kidsCount?: number; notes?: string; cancellationReason?: string;
};
type Ref = { id: string; name: string };
type PageResult<T> = { data: T[]; total: number; page: number; limit: number; hasNextPage: boolean };
type Estimate = { available: boolean; daysCount: number; pricePerDay: number; vat: number; bookingAmount: number; vatAmount: number; totalAmount: number };
type Locale = 'ar' | 'en';
type AuthFieldName = 'name' | 'email' | 'countryCode' | 'phone' | 'password' | 'confirmPassword';
type AuthFieldErrors = Partial<Record<AuthFieldName, string>>;
type PhoneNumberTools = {
  getCountries: typeof getCountries;
  getCountryCallingCode: typeof getCountryCallingCode;
  parsePhoneNumberFromString: typeof parsePhoneNumberFromString;
};
type SearchParams = Partial<Record<'where' | 'minPrice' | 'maxPrice' | 'unitCategory' | 'roomsCount' | 'adultGuests' | 'kidsCount' | 'hasInternetService' | 'hasKitchen' | 'hasPrivateGarage' | 'checkIn' | 'checkOut', string>>;

const words = {
  ar: {
    heroImageAlt: 'إقامة مصممة بعناية في ضوء الصباح', heroKicker: 'رحلات تبدأ بقصة شخصية', heroCaption: 'مكان تعود إليه من جديد', curated: 'مختارة لرحلتك القادمة', journalKicker: 'حكاية رحلاتك', hostKicker: 'شارك مكانًا تحبه', hostFormKicker: 'كل إقامة جيدة تبدأ بقصة جميلة', newStay: 'إقامة جديدة',
    brand: 'رِحال', tagline: 'لكل رحلة مكان', explore: 'اكتشف الإقامات', trips: 'رحلاتي', navigation: 'التنقل الرئيسي',
    host: 'كن مضيفًا', account: 'تسجيل الدخول', search: 'ابحث عن مكان', where: 'إلى أين؟',
    dates: 'التواريخ', guests: 'الضيوف', homes: 'إقامات مختارة', stays: 'إقامة',
    night: 'لليلة', all: 'كل الإقامات', loadMore: '\u0639\u0631\u0636 \u0627\u0644\u0645\u0632\u064a\u062f \u0645\u0646 \u0627\u0644\u0625\u0642\u0627\u0645\u0627\u062a', moreResults: '\u0642\u062f \u062a\u0638\u0647\u0631 \u0625\u0642\u0627\u0645\u0627\u062a \u0623\u062e\u0631\u0649 \u0639\u0646\u062f \u0645\u062a\u0627\u0628\u0639\u0629 \u0627\u0644\u062a\u0635\u0641\u062d.', noResults: 'لم نعثر على إقامة مطابقة',
    noResultsHint: 'جرّب تغيير الوجهة أو توسيع نطاق السعر.', details: 'التفاصيل',
    bedrooms: 'غرف نوم', guestsCapacity: 'ضيوف', amenities: 'ما يقدمه المكان',
    reserve: 'احجز الإقامة', checkIn: 'تسجيل الوصول', checkOut: 'تسجيل المغادرة',
    adults: 'بالغون', children: 'أطفال', notes: 'رسالة للمضيف (اختياري)',
    check: 'تحقق من السعر والتوفر', booking: 'إرسال طلب الحجز', available: 'متاح في هذه التواريخ',
    unavailable: 'غير متاح في هذه التواريخ', subtotal: 'الإقامة', tax: 'الضرائب', total: 'الإجمالي',
    login: 'تسجيل الدخول', register: 'إنشاء حساب', name: 'الاسم الكامل', email: 'البريد الإلكتروني',
    password: 'كلمة المرور', countryCode: 'مفتاح الدولة', phone: 'رقم الهاتف',
    namePlaceholder: 'محمد مصطفى', emailPlaceholder: 'name@example.com', phonePlaceholder: '10 1234 5678', passwordPlaceholder: 'أدخل كلمة المرور', phoneHint: 'اكتب رقمك المحلي، وسنتحقق من توافقه مع مفتاح الدولة.', searchCountry: 'ابحث عن دولة أو مفتاح اتصال', noCountriesFound: 'لا توجد دولة مطابقة', phoneInvalid: 'رقم الهاتف لا يتوافق مع الدولة أو مفتاح الاتصال المختار.',
    authWelcome: 'أهلًا بك في رِحال', authIntro: 'سجّل الدخول لمتابعة رحلتك، أو أنشئ حسابًا لتبدأ حكاية جديدة.',
    authStoryTitle: 'رحلتك القادمة تبدأ بمكان مناسب.', authStoryBody: 'اكتشف إقامات مختارة بعناية، واحجز بثقة، واحتفظ بكل تفاصيل رحلتك في مكان واحد.',
    authPrivacy: 'بياناتك محفوظة، وتجربتك تبدأ على راحتك.', authLoginSuccess: 'تم تسجيل الدخول بنجاح.', authRegisterSuccess: 'أُنشئ حسابك بنجاح. أهلًا بك في رِحال.',
    confirmPassword: 'تأكيد كلمة المرور', passwordHint: 'استخدم من 8 إلى 128 حرفًا.', passwordMismatch: 'كلمتا المرور غير متطابقتين.',
    showPassword: 'إظهار كلمة المرور', hidePassword: 'إخفاء كلمة المرور',
    nameRequired: 'أدخل اسمك الكامل.', nameLength: 'يجب أن يتراوح الاسم بين حرفين و50 حرفًا.',
    emailRequired: 'أدخل بريدك الإلكتروني.', emailInvalid: 'تحقق من صيغة البريد الإلكتروني.',
    countryCodeRequired: 'أدخل مفتاح الدولة، مثل +20.', countryCodeInvalid: 'اكتب مفتاح الدولة بصيغة دولية مثل +20.', phoneRequired: 'أدخل رقم الهاتف.',
    passwordRequired: 'أدخل كلمة المرور.', passwordLength: 'يجب أن تكون كلمة المرور من 8 إلى 128 حرفًا.',
    confirmPasswordRequired: 'أعد كتابة كلمة المرور للتأكيد.',
    continue: 'متابعة', loginSubmit: 'تسجيل الدخول', registerSubmit: 'إنشاء الحساب', invalidCredentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.', signOut: 'تسجيل الخروج', loginRequired: 'سجّل الدخول لمتابعة الحجز.',
    loadError: 'تعذر تحميل البيانات. تحقق من اتصال الخادم ثم أعد المحاولة.',
    saved: 'تم إرسال طلب الحجز بنجاح.', listingSaved: 'تم نشر وحدتك بنجاح.',
    tripsTitle: 'رحلاتك القادمة والسابقة', myPlaces: 'أماكني', addPlace: 'أضف مكانًا',
    createListing: 'أضف وحدتك', title: 'اسم الإقامة', description: 'وصف المكان',
    address: 'العنوان', photoUrl: 'رابط صورة رئيسية', price: 'السعر لليلة',
    country: 'الدولة', city: 'المدينة', category: 'نوع الإقامة', rooms: 'عدد الغرف', chooseOption: '\u0627\u062e\u062a\u0631', listingRequired: '\u0627\u062e\u062a\u0631 \u0627\u0644\u062f\u0648\u0644\u0629 \u0648\u0627\u0644\u0645\u062f\u064a\u0646\u0629 \u0648\u0646\u0648\u0639 \u0627\u0644\u0625\u0642\u0627\u0645\u0629 \u0642\u0628\u0644 \u0627\u0644\u0646\u0634\u0631.',
    internet: 'إنترنت', kitchen: 'مطبخ', garage: 'موقف خاص', publish: 'نشر الإقامة',
    close: 'إغلاق', filter: 'تصفية', maxPrice: 'أقصى سعر لليلة', minPrice: 'أقل سعر لليلة', loading: 'جارٍ التحميل…',
    filters: '\u062e\u0635\u0651\u0635 \u0625\u0642\u0627\u0645\u062a\u0643', roomsFilter: 'عدد غرف النوم بالضبط', features: 'مميزات المكان', applyFilters: 'عرض الإقامات', clearFilters: 'مسح الفلاتر',
    adultsFilter: '\u0639\u062f\u062f \u0627\u0644\u0628\u0627\u0644\u063a\u064a\u0646', childrenFilter: 'أطفال', datesHint: 'تأكد من التوفر داخل الإقامة',
    saveStay: 'حفظ الإقامة', removeSavedStay: 'إزالة من المحفوظات',
    previewOnly: 'عرض تجريبي', previewMessage: 'هذه إقامة تجريبية؛ الصور توضيحية ولا يمكن إرسال طلب حجز لها.',
    statusPending: 'قيد الانتظار', statusConfirmed: 'مؤكد', statusRejected: 'مرفوض',
    statusCancelled: 'ملغي', statusCompleted: 'مكتمل',
    asGuest: 'كضيف', asHost: 'كمضيف', active: 'نشطة', paused: 'متوقفة',
    pauseListing: 'إيقاف العرض', activateListing: 'إعادة التفعيل', deleteListing: 'حذف الإقامة',
  },
  en: {
    heroImageAlt: 'A thoughtfully designed stay in the morning light', heroKicker: 'Journeys, made personal', heroCaption: 'A place to come back to', curated: 'Curated for your next chapter', journalKicker: 'Your travel journal', hostKicker: 'Make room for something new', hostFormKicker: 'A good place starts with a good story', newStay: 'New stay',
    brand: 'RIHAL', tagline: 'A place for every journey', explore: 'Explore stays', trips: 'My trips', navigation: 'Main navigation',
    host: 'Become a host', account: 'Log in', search: 'Find a place', where: 'Where to?',
    dates: 'Dates', guests: 'Guests', homes: 'Handpicked stays', stays: 'stays',
    night: 'night', all: 'All stays', loadMore: 'Show more stays', moreResults: 'There may be more stays on the next page.', noResults: 'No stays match your search',
    noResultsHint: 'Try changing the destination or widening your price range.', details: 'Details',
    bedrooms: 'bedrooms', guestsCapacity: 'guests', amenities: 'What this place offers',
    reserve: 'Reserve your stay', checkIn: 'Check-in', checkOut: 'Check-out',
    adults: 'Adults', children: 'Children', notes: 'Message to host (optional)',
    check: 'Check price & availability', booking: 'Request to book', available: 'Available for these dates',
    unavailable: 'Unavailable for these dates', subtotal: 'Stay', tax: 'Taxes', total: 'Total',
    login: 'Log in', register: 'Create account', name: 'Full name', email: 'Email address',
    password: 'Password', countryCode: 'Dial code', phone: 'Phone number',
    namePlaceholder: 'Muhammed Mustafa', emailPlaceholder: 'name@example.com', phonePlaceholder: '10 1234 5678', passwordPlaceholder: 'Enter your password', phoneHint: 'Enter your local number. We’ll check it against the selected country code.', searchCountry: 'Search country or calling code', noCountriesFound: 'No matching country', phoneInvalid: 'This phone number does not match the selected country code.',
    authWelcome: 'Welcome to Rihal', authIntro: 'Log in to pick up where your journey left off, or create an account to begin a new one.',
    authStoryTitle: 'Your next journey starts with the right place.', authStoryBody: 'Discover considered stays, book with confidence, and keep every detail of your trip in one place.',
    authPrivacy: 'Your details stay private. Settle in at your own pace.', authLoginSuccess: 'You are now logged in.', authRegisterSuccess: 'Your account is ready. Welcome to Rihal.',
    confirmPassword: 'Confirm password', passwordHint: 'Use 8 to 128 characters.', passwordMismatch: 'Your passwords do not match.',
    showPassword: 'Show password', hidePassword: 'Hide password',
    nameRequired: 'Enter your full name.', nameLength: 'Name must be between 2 and 50 characters.',
    emailRequired: 'Enter your email address.', emailInvalid: 'Check the email address format.',
    countryCodeRequired: 'Enter a country dial code, such as +20.', countryCodeInvalid: 'Use the international format, such as +20.', phoneRequired: 'Enter your phone number.',
    passwordRequired: 'Enter your password.', passwordLength: 'Password must be between 8 and 128 characters.',
    confirmPasswordRequired: 'Re-enter your password to confirm it.',
    continue: 'Continue', loginSubmit: 'Log in', registerSubmit: 'Create account', invalidCredentials: 'The email address or password is incorrect.', signOut: 'Log out', loginRequired: 'Log in to continue with your booking.',
    loadError: 'Could not load the listings. Check the API connection and try again.',
    saved: 'Your booking request was sent.', listingSaved: 'Your stay is now published.',
    tripsTitle: 'Your upcoming and past trips', myPlaces: 'My places', addPlace: 'Add a place',
    createListing: 'List your place', title: 'Listing title', description: 'Describe your place',
    address: 'Street address', photoUrl: 'Cover photo URL', price: 'Price per night',
    country: 'Country', city: 'City', category: 'Stay type', rooms: 'Bedrooms', chooseOption: 'Choose', listingRequired: 'Choose a country, city, and stay type before publishing.',
    internet: 'Wi-Fi', kitchen: 'Kitchen', garage: 'Private parking', publish: 'Publish listing',
    close: 'Close', filter: 'Filter', maxPrice: 'Max price per night', minPrice: 'Minimum price per night', loading: 'Loading…',
    filters: 'Refine your stay', roomsFilter: 'Exact number of bedrooms', features: 'Amenities', applyFilters: 'Show stays', clearFilters: 'Clear filters',
    adultsFilter: 'Adults', childrenFilter: 'Children', datesHint: 'Availability is confirmed for each stay',
    saveStay: 'Save stay', removeSavedStay: 'Remove saved stay',
    previewOnly: 'Preview stay', previewMessage: 'This is a preview listing. Photos are illustrative and booking requests are disabled.',
    statusPending: 'Pending', statusConfirmed: 'Confirmed', statusRejected: 'Declined',
    statusCancelled: 'Cancelled', statusCompleted: 'Completed',
    asGuest: 'As a guest', asHost: 'As a host', active: 'Published', paused: 'Paused',
    pauseListing: 'Pause listing', activateListing: 'Publish again', deleteListing: 'Delete stay',
  },
} as const;

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch('/api/backend/' + path, {
    ...options,
    headers: {
      'accept-language': typeof document === 'undefined' ? 'ar' : document.documentElement.lang,
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...options.headers,
    },
    cache: 'no-store',
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof body?.message === 'string'
      ? body.message
      : Array.isArray(body?.message) ? body.message.join(' · ') : (typeof document !== 'undefined' && document.documentElement.lang === 'ar' ? 'تعذر تنفيذ الطلب' : 'Request failed');
    throw new Error(message);
  }
  return body as T;
}

function pageData<T>(value: unknown): PageResult<T> {
  if (typeof value !== 'object' || value === null) return { data: [], total: 0, page: 1, limit: 0, hasNextPage: false };
  const outer = value as { data?: unknown; total?: number; page?: number; limit?: number };
  if (Array.isArray(outer.data)) {
    const meta = typeof (outer as { meta?: unknown }).meta === 'object' && (outer as { meta?: unknown }).meta !== null
      ? (outer as { meta: { total?: number; page?: number; limit?: number; hasNextPage?: boolean } }).meta
      : {};
    const total = outer.total ?? meta.total ?? outer.data.length;
    const page = outer.page ?? meta.page ?? 1;
    const limit = outer.limit ?? meta.limit ?? outer.data.length;
    return {
      data: outer.data as T[], total, page, limit,
      hasNextPage: meta.hasNextPage ?? (page * limit < total),
    };
  }
  if (typeof outer.data === 'object' && outer.data !== null && Array.isArray((outer.data as { data?: unknown }).data)) {
    return outer.data as PageResult<T>;
  }
  return { data: [], total: 0, page: 1, limit: 0, hasNextPage: false };
}

function paginationItems(current: number, total: number): (number | string)[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  return sorted.flatMap((page, index) => {
    if (index === 0) return [page];
    const previous = sorted[index - 1] ?? page;
    return [...(page - previous === 2 ? [previous + 1] : page - previous > 2 ? [`gap-${previous}`] : []), page];
  });
}

function arrayData<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === 'object' && value !== null) {
    const outer = value as { data?: unknown };
    if (Array.isArray(outer.data)) return outer.data as T[];
    if (typeof outer.data === 'object' && outer.data !== null && Array.isArray((outer.data as { data?: unknown }).data)) {
      return (outer.data as { data: T[] }).data;
    }
  }
  return [];
}

function objectData<T>(value: unknown): T {
  if (typeof value === 'object' && value !== null && 'data' in value) {
    const data = (value as { data: unknown }).data;
    if (typeof data === 'object' && data !== null && 'data' in data) return (data as { data: T }).data;
    return data as T;
  }
  return value as T;
}

function nextDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
}

function countryFlag(code: string) {
  return String.fromCodePoint(...code.toUpperCase().split('').map((letter) => 127397 + letter.charCodeAt(0)));
}

export default function CustomerHome({ initialLocale = 'ar', initialSignedIn = false, initialSearchParams = {} }: { initialLocale?: Locale; initialSignedIn?: boolean; initialSearchParams?: SearchParams }) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [view, setView] = useState<'explore' | 'trips' | 'host'>('explore');
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitsPage, setUnitsPage] = useState(1);
  const [unitsTotal, setUnitsTotal] = useState(0);
  const unitsPerPage = 6;
  const unitsPageCount = Math.ceil(unitsTotal / unitsPerPage);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingMutationId, setBookingMutationId] = useState<string | null>(null);
  const [bookingMutationAction, setBookingMutationAction] = useState<'edit' | 'cancel' | 'confirm' | 'decline' | null>(null);
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [cancellationTarget, setCancellationTarget] = useState<Booking | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [myUnits, setMyUnits] = useState<Unit[]>([]);
  const [party, setParty] = useState<'guest' | 'host'>('guest');
  const [countries, setCountries] = useState<Ref[]>([]);
  const [cities, setCities] = useState<Ref[]>([]);
  const [categories, setCategories] = useState<Ref[]>([]);
  const [listingCountry, setListingCountry] = useState('');
  const [listingCity, setListingCity] = useState('');
  const [listingCategory, setListingCategory] = useState('');
  const [listingValidationAttempted, setListingValidationAttempted] = useState(false);
  const [selected, setSelected] = useState<Unit | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [authOpen, setAuthOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [phoneTools, setPhoneTools] = useState<PhoneNumberTools | null>(null);
  const phoneToolsRef = useRef<PhoneNumberTools | null>(null);
  const [phoneCountryCodes, setPhoneCountryCodes] = useState<CountryCode[]>([]);
  const [dialCountry, setDialCountry] = useState<CountryCode>('EG');
  const [dialPickerOpen, setDialPickerOpen] = useState(false);
  const [dialSearch, setDialSearch] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [authFieldErrors, setAuthFieldErrors] = useState<AuthFieldErrors>({});
  const [signedIn, setSignedIn] = useState(initialSignedIn);
  const [query, setQuery] = useState(initialSearchParams.where ?? '');
  const [destinationOpen, setDestinationOpen] = useState(false);
  const [activeDestinationIndex, setActiveDestinationIndex] = useState(-1);
  const destinationFieldRef = useRef<HTMLDivElement>(null);
  const [maxPrice, setMaxPrice] = useState(initialSearchParams.maxPrice ?? '');
  const [category, setCategory] = useState(initialSearchParams.unitCategory ?? '');
  const [minPrice, setMinPrice] = useState(initialSearchParams.minPrice ?? '');
  const [roomsFilter, setRoomsFilter] = useState(initialSearchParams.roomsCount ?? '');
  const [internetFilter, setInternetFilter] = useState(initialSearchParams.hasInternetService === 'true');
  const [kitchenFilter, setKitchenFilter] = useState(initialSearchParams.hasKitchen === 'true');
  const [garageFilter, setGarageFilter] = useState(initialSearchParams.hasPrivateGarage === 'true');
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [referenceDataReady, setReferenceDataReady] = useState(false);
  const [searchRevision, setSearchRevision] = useState(0);
  const unitsRequestRef = useRef<AbortController | null>(null);
  const initialUnitsLoadStartedRef = useRef(false);
  const shouldLoadInitialUnitsImmediatelyRef = useRef(!initialSearchParams.where?.trim());
  const loadUnitsRef = useRef<(page?: number, append?: boolean) => Promise<void>>(() => Promise.resolve());
  const previousQueryRef = useRef<string | null>(initialSearchParams.where ?? '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [checkIn, setCheckIn] = useState(initialSearchParams.checkIn ?? nextDate(14));
  const [checkOut, setCheckOut] = useState(initialSearchParams.checkOut ?? nextDate(16));
  const [adultsCount, setAdults] = useState(0);
  const [bookingAdultsCount, setBookingAdults] = useState(1);
  const [kidsCount, setKids] = useState(Math.max(0, Number(initialSearchParams.kidsCount ?? 0)));
  const t = words[locale];
  const bookingText = locale === 'ar' ? {
    edit: '\u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0637\u0644\u0628', cancel: '\u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u062d\u062c\u0632', accept: '\u0642\u0628\u0648\u0644 \u0627\u0644\u0637\u0644\u0628', decline: '\u0631\u0641\u0636 \u0627\u0644\u0637\u0644\u0628', save: '\u062d\u0641\u0638 \u0627\u0644\u062a\u0639\u062f\u064a\u0644\u0627\u062a', reason: '\u0633\u0628\u0628 \u0627\u0644\u0625\u0644\u063a\u0627\u0621 (\u0627\u062e\u062a\u064a\u0627\u0631\u064a)', cancelPrompt: '\u0647\u0644 \u062a\u0631\u064a\u062f \u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u062d\u062c\u0632\u061f', confirmCancel: '\u062a\u0623\u0643\u064a\u062f \u0627\u0644\u0625\u0644\u063a\u0627\u0621', keep: '\u0627\u0644\u0627\u062d\u062a\u0641\u0627\u0638 \u0628\u0627\u0644\u062d\u062c\u0632', updated: '\u062a\u0645 \u062a\u062d\u062f\u064a\u062b \u0637\u0644\u0628 \u0627\u0644\u062d\u062c\u0632.', cancelled: '\u062a\u0645 \u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u062d\u062c\u0632.', decisionSaved: '\u062a\u0645 \u062a\u062d\u062f\u064a\u062b \u062d\u0627\u0644\u0629 \u0627\u0644\u0637\u0644\u0628.', empty: '\u0644\u0627 \u062a\u0648\u062c\u062f \u062d\u062c\u0648\u0632\u0627\u062a \u0647\u0646\u0627 \u0645\u0639 \u0630\u0644\u0643.', invalidDates: '\u062a\u0623\u0643\u062f \u0645\u0646 \u0623\u0646 \u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0645\u063a\u0627\u062f\u0631\u0629 \u0628\u0639\u062f \u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0648\u0635\u0648\u0644.', loading: '\u062c\u0627\u0631\u064d \u0627\u0644\u062a\u062d\u0645\u064a\u0644\u2026', retry: '\u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629',
  } : {
    edit: 'Edit request', cancel: 'Cancel booking', accept: 'Accept request', decline: 'Decline request', save: 'Save changes', reason: 'Reason for cancellation (optional)', cancelPrompt: 'Cancel this booking?', confirmCancel: 'Confirm cancellation', keep: 'Keep booking', updated: 'Your booking request was updated.', cancelled: 'Your booking was cancelled.', decisionSaved: 'Booking status updated.', empty: 'No bookings to show here yet.', invalidDates: 'Check that check-out is after check-in.', loading: 'Updating booking…', retry: 'Try again',
  };
  const destinationSuggestions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase(locale);
    const destinations = [
      ...cities.map((item) => ({ ...item, kind: 'city' as const })),
      ...countries.map((item) => ({ ...item, kind: 'country' as const })),
    ];
    const seen = new Set<string>();
    const uniqueDestinations = destinations.filter((item) => {
      const localizedName = localizeReference(item.name, locale);
      const key = localizedName.toLocaleLowerCase(locale);
      if (seen.has(key)) return false;
      seen.add(key);
      return !normalizedQuery || localizedName.toLocaleLowerCase(locale).includes(normalizedQuery) || item.name.toLocaleLowerCase(locale).includes(normalizedQuery);
    });
    if (normalizedQuery) return uniqueDestinations.slice(0, 7);
    return [...uniqueDestinations.filter((item) => item.kind === 'city').slice(0, 4), ...uniqueDestinations.filter((item) => item.kind === 'country').slice(0, 3)];
  }, [cities, countries, locale, query]);
  const dialCountries = useMemo(() => {
    const names = new Intl.DisplayNames([locale], { type: 'region' });
    return phoneCountryCodes.map((code) => ({
      code,
      name: names.of(code) ?? code,
      dialCode: `+${phoneTools?.getCountryCallingCode(code) ?? 20}`,
    })).sort((left, right) => left.name.localeCompare(right.name, locale));
  }, [locale, phoneCountryCodes, phoneTools]);
  const selectedDialCountry = dialCountries.find((country) => country.code === dialCountry) ?? {
    code: 'EG' as CountryCode,
    name: new Intl.DisplayNames([locale], { type: 'region' }).of('EG') ?? 'Egypt',
    dialCode: '+20',
  };
  const filteredDialCountries = dialCountries.filter((country) =>
    `${country.name} ${country.code} ${country.dialCode}`.toLocaleLowerCase(locale).includes(dialSearch.trim().toLocaleLowerCase(locale)),
  );

  useEffect(() => {
    if (!authOpen || !registering || phoneToolsRef.current) return;
    let active = true;
    void import('libphonenumber-js').then((tools) => {
      if (!active) return;
      phoneToolsRef.current = tools;
      setPhoneTools(tools);
      setPhoneCountryCodes(tools.getCountries());
    });
    return () => { active = false; };
  }, [authOpen, registering]);

  const loadUnits = useCallback(async (page = 1) => {
    unitsRequestRef.current?.abort();
    const controller = new AbortController();
    unitsRequestRef.current = controller;
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: String(page), limit: String(unitsPerPage) });
    const term = query.trim();
    const normalizedTerm = term.toLocaleLowerCase();
    const matchedCity = cities.find((item) => item.name.toLocaleLowerCase() === normalizedTerm || localizeReference(item.name, locale).toLocaleLowerCase() === normalizedTerm);
    const matchedCountry = countries.find((item) => item.name.toLocaleLowerCase() === normalizedTerm || localizeReference(item.name, locale).toLocaleLowerCase() === normalizedTerm);
    if (matchedCity) params.set('city', matchedCity.id);
    else if (matchedCountry) params.set('country', matchedCountry.id);
    else if (term.length >= 3) params.set('title', term);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (category) params.set('unitCategory', category);
    if (roomsFilter) params.set('roomsCount', roomsFilter);
    if (internetFilter) params.set('hasInternetService', 'true');
    if (kitchenFilter) params.set('hasKitchen', 'true');
    if (garageFilter) params.set('hasPrivateGarage', 'true');
    try {
      const result = pageData<Unit>(await api('units?' + params.toString(), { signal: controller.signal }));
      const matchingUnits = (result.data ?? []).filter((unit) => unit.adultsCount >= adultsCount && unit.kidsCount >= kidsCount);
      setUnits(matchingUnits);
      setUnitsTotal(result.total);
      setUnitsPage(result.page);
      const url = new URL(window.location.href);
      ['where', 'page', 'checkIn', 'checkOut', 'minPrice', 'maxPrice', 'unitCategory', 'roomsCount', 'adultsCount', 'adultGuests', 'kidsCount', 'hasInternetService', 'hasKitchen', 'hasPrivateGarage'].forEach((key) => url.searchParams.delete(key));
      if (term) url.searchParams.set('where', term);
      if (result.page > 1) url.searchParams.set('page', String(result.page));
      if (checkIn) url.searchParams.set('checkIn', checkIn);
      if (checkOut) url.searchParams.set('checkOut', checkOut);
      if (minPrice) url.searchParams.set('minPrice', minPrice);
      if (maxPrice) url.searchParams.set('maxPrice', maxPrice);
      if (category) url.searchParams.set('unitCategory', category);
      if (roomsFilter) url.searchParams.set('roomsCount', roomsFilter);
      if (adultsCount > 0) url.searchParams.set('adultGuests', String(adultsCount));
      if (kidsCount > 0) url.searchParams.set('kidsCount', String(kidsCount));
      if (internetFilter) url.searchParams.set('hasInternetService', 'true');
      if (kitchenFilter) url.searchParams.set('hasKitchen', 'true');
      if (garageFilter) url.searchParams.set('hasPrivateGarage', 'true');
      window.history.replaceState({}, '', url);
    } catch (cause) {
      if (!(cause instanceof DOMException && cause.name === 'AbortError')) setError(t.loadError);
    } finally {
      if (unitsRequestRef.current === controller) {
        setLoading(false);
      }
    }
  }, [query, minPrice, maxPrice, category, roomsFilter, internetFilter, kitchenFilter, garageFilter, adultsCount, kidsCount, cities, countries, locale, checkIn, checkOut, t.loadError]);

  const loadBookings = useCallback(async (which: 'guest' | 'host' = party) => {
    setBookingsLoading(true);
    setError('');
    try {
      const result = pageData<Booking>(await api('bookings/me?party=' + which + '&page=1&limit=20'));
      setBookings(result.data ?? []);
    } catch (cause) { setError(cause instanceof Error ? cause.message : t.loadError); }
    finally { setBookingsLoading(false); }
  }, [party, t.loadError]);

  const loadMyUnits = useCallback(async () => {
    setError('');
    try {
      const result = pageData<Unit>(await api('units/me?page=1&limit=50'));
      setMyUnits(result.data ?? []);
    } catch (cause) { setError(cause instanceof Error ? cause.message : t.loadError); }
  }, [t.loadError]);

  useEffect(() => {
    let current = true;
    void Promise.all([
      api('countries').then(arrayData<Ref>).catch(() => []),
      api('cities').then(arrayData<Ref>).catch(() => []),
      api('unit-categories').then(arrayData<Ref>).catch(() => []),
    ]).then(([countryRefs, cityRefs, categoryRefs]) => {
      if (!current) return;
      setCountries(countryRefs);
      setCities(cityRefs);
      setCategories(categoryRefs);
      setReferenceDataReady(true);
    });
    return () => { current = false; };
  }, []);

  useEffect(() => {
    if (!destinationOpen) return;
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (event.target instanceof Node && !destinationFieldRef.current?.contains(event.target)) setDestinationOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsidePress);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePress);
  }, [destinationOpen]);

  useEffect(() => {
    api('auth/me').then(() => setSignedIn(true)).catch(() => setSignedIn(false));
  }, []);

  useEffect(() => {
    loadUnitsRef.current = loadUnits;
  }, [loadUnits]);

  useEffect(() => {
    if (!shouldLoadInitialUnitsImmediatelyRef.current) return;
    initialUnitsLoadStartedRef.current = true;
    void loadUnitsRef.current();
  }, []);

  useEffect(() => {
    if (!referenceDataReady) return;
    if (initialUnitsLoadStartedRef.current) {
      initialUnitsLoadStartedRef.current = false;
      return;
    }
    const timer = window.setTimeout(() => void loadUnitsRef.current(), 0);
    return () => window.clearTimeout(timer);
  }, [referenceDataReady, searchRevision]);

  useEffect(() => {
    if (!referenceDataReady) return;
    if (previousQueryRef.current === null || previousQueryRef.current === query) {
      previousQueryRef.current = query;
      return;
    }
    previousQueryRef.current = query;
    const timer = window.setTimeout(() => setSearchRevision((revision) => revision + 1), 350);
    return () => window.clearTimeout(timer);
  }, [query, referenceDataReady]);


  useEffect(() => () => unitsRequestRef.current?.abort(), []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale]);

  useEffect(() => {
    if (!selected && !authOpen && !filtersOpen && !cancellationTarget) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusDialog = () => {
      const dialog = document.querySelector<HTMLElement>('.booking-confirm-dialog, .auth-modal, .filter-panel, .detail-modal');
      const preferred = dialog?.querySelector<HTMLElement>('[data-autofocus]:not([disabled])');
      (preferred ?? dialog?.querySelector<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'))?.focus();
    };
    const frame = window.requestAnimationFrame(focusDialog);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (authOpen) { setAuthOpen(false); setAuthFieldErrors({}); setPasswordVisible(false); }
        else if (cancellationTarget) { setCancellationTarget(null); setCancellationReason(''); }
        else if (filtersOpen) setFiltersOpen(false);
        else setSelected(null);
      }
      if (event.key !== 'Tab') return;
      const dialog = document.querySelector<HTMLElement>('.booking-confirm-dialog, .auth-modal, .filter-panel, .detail-modal');
      const focusable = [
        ...(dialog ? [...dialog.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')] : []),
        ...(filtersOpen ? [...document.querySelectorAll<HTMLElement>('.premium-dropdown-menu button:not([disabled])')] : []),
      ].filter((node) => node.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [selected, authOpen, filtersOpen, cancellationTarget]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = JSON.parse(window.localStorage.getItem('sakan-favorites') ?? '[]') as unknown;
        if (Array.isArray(saved)) setFavoriteIds(new Set(saved.filter((id): id is string => typeof id === 'string')));
      } catch { window.localStorage.removeItem('sakan-favorites'); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const locationName = useMemo(() => (unit: Unit) => {
    const city = cities.find((item) => item.id === unit.city)?.name;
    const country = countries.find((item) => item.id === unit.country)?.name;
    return [city, country].filter((name): name is string => Boolean(name)).map((name) => localizeReference(name, locale)).join(locale === 'ar' ? '، ' : ', ') || unit.address;
  }, [cities, countries, locale]);

  function chooseLocale(value: Locale) {
    setLocale(value);
    document.cookie = 'sakan_locale=' + value + '; Path=/; Max-Age=31536000; SameSite=Lax';
  }

  function toggleFavorite(unitId: string) {
    const next = new Set(favoriteIds);
    if (next.has(unitId)) next.delete(unitId);
    else next.add(unitId);
    setFavoriteIds(next);
    window.localStorage.setItem('sakan-favorites', JSON.stringify([...next]));
  }

  async function openUnit(unit: Unit) {
    setSelected(unit);
    setGalleryIndex(0);
    preloadSmartImage(unit.photos?.[0]);
    setEstimate(null);
    setBookingAdults(Math.min(Math.max(adultsCount, 1), unit.adultsCount));
    setKids(Math.min(kidsCount, unit.kidsCount));
  }

  async function checkPrice() {
    if (!selected) return;
    setBusy(true); setError(''); setEstimate(null);
    try {
      const params = new URLSearchParams({ unit: selected.id, checkIn, checkOut, adultsCount: String(bookingAdultsCount), kidsCount: String(kidsCount) });
      setEstimate(objectData<Estimate>(await api('bookings/check-availability?' + params.toString())));
    } catch (cause) { setError(cause instanceof Error ? cause.message : t.loadError); }
    finally { setBusy(false); }
  }

  async function requestBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !estimate?.available) return;
    if (!signedIn) { setAuthOpen(true); setError(t.loginRequired); return; }
    const notes = new FormData(event.currentTarget).get('notes');
    setBusy(true); setError('');
    try {
      await api('bookings', { method: 'POST', body: JSON.stringify({
        unit: selected.id, checkIn, checkOut, adultsCount: bookingAdultsCount, kidsCount,
        ...(typeof notes === 'string' && notes.trim() ? { notes: notes.trim() } : {}),
      }) });
      setNotice(t.saved); setSelected(null); setEstimate(null);
      if (view === 'trips') await loadBookings();
    } catch (cause) { setError(cause instanceof Error ? cause.message : t.loadError); }
    finally { setBusy(false); }
  }

  function authFieldError(fieldName: string, form: HTMLFormElement): string | undefined {
    const value = String(new FormData(form).get(fieldName) ?? '');
    switch (fieldName as AuthFieldName) {
      case 'name':
        if (!value.trim()) return t.nameRequired;
        if (value.trim().length < 2 || value.trim().length > 50) return t.nameLength;
        break;
      case 'email': {
        if (!value.trim()) return t.emailRequired;
        const emailInput = form.elements.namedItem('email') as HTMLInputElement | null;
        if (emailInput?.validity.typeMismatch) return t.emailInvalid;
        break;
      }
      case 'countryCode':
        if (registering && !selectedDialCountry) return t.countryCodeRequired;
        if (registering && value.trim() !== selectedDialCountry.dialCode) return t.countryCodeInvalid;
        break;
      case 'phone':
        if (registering && !value.trim()) return t.phoneRequired;
        if (registering && phoneToolsRef.current && !phoneToolsRef.current.parsePhoneNumberFromString(`${selectedDialCountry.dialCode}${value.trim()}`)?.isValid()) return t.phoneInvalid;
        break;
      case 'password':
        if (!value) return t.passwordRequired;
        if (registering && (value.length < 8 || value.length > 128)) return t.passwordLength;
        break;
      case 'confirmPassword':
        if (registering && !value) return t.confirmPasswordRequired;
        if (registering && value !== String(new FormData(form).get('password') ?? '')) return t.passwordMismatch;
        break;
    }
    return undefined;
  }

  function handleAuthFieldBlur(event: FocusEvent<HTMLInputElement>) {
    const form = event.currentTarget.form;
    if (!form) return;
    const field = event.currentTarget.name as AuthFieldName;
    // Required errors belong to an attempted submission. Leaving an untouched,
    // empty field (for example by clicking the story panel) should stay quiet.
    if (!event.currentTarget.value.trim() && !authFieldErrors[field]) return;
    const message = authFieldError(field, form);
    setAuthFieldErrors((current) => {
      const next = { ...current };
      if (message) next[field] = message;
      else delete next[field];
      return next;
    });
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError('');
    if (registering && !phoneToolsRef.current) {
      try {
        const tools = await import('libphonenumber-js');
        phoneToolsRef.current = tools;
        setPhoneTools(tools);
        setPhoneCountryCodes(tools.getCountries());
      } catch {
        setError(t.loadError);
        setBusy(false);
        return;
      }
    }
    const form = new FormData(event.currentTarget);
    const fields: AuthFieldName[] = registering
      ? ['name', 'countryCode', 'phone', 'email', 'password', 'confirmPassword']
      : ['email', 'password'];
    const nextFieldErrors: AuthFieldErrors = {};
    for (const field of fields) {
      const message = authFieldError(field, event.currentTarget);
      if (message) nextFieldErrors[field] = message;
    }
    if (Object.keys(nextFieldErrors).length) {
      setAuthFieldErrors(nextFieldErrors);
      setBusy(false);
      const firstInvalidField = fields.find((field) => nextFieldErrors[field]);
      if (firstInvalidField) {
        const invalidControl = firstInvalidField === 'countryCode'
          ? event.currentTarget.querySelector('[data-country-picker]')
          : event.currentTarget.elements.namedItem(firstInvalidField);
        if (invalidControl instanceof HTMLElement) invalidControl.focus();
      }
      return;
    }
    setAuthFieldErrors({});
    const payload = Object.fromEntries(form.entries());
    delete payload.confirmPassword;
    if (typeof payload.email === 'string') payload.email = payload.email.trim().toLowerCase();
    if (typeof payload.name === 'string') payload.name = payload.name.trim();
    if (typeof payload.countryCode === 'string') payload.countryCode = payload.countryCode.trim();
    if (typeof payload.phone === 'string') payload.phone = payload.phone.trim();
    try {
      const action = registering ? 'register' : 'login';
      const response = await fetch('/api/auth/' + action, {
        method: 'POST', headers: { 'content-type': 'application/json', 'accept-language': locale },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errors = Array.isArray(body.errors) ? body.errors as { code?: string; field?: string; message?: string }[] : [];
        const apiError = errors.find((item) => typeof item.message === 'string');
        const applicationCode = typeof body.code === 'string' ? body.code : undefined;
        const field = apiError?.field === 'email' || apiError?.field === 'name' || apiError?.field === 'countryCode' || apiError?.field === 'phone' || apiError?.field === 'password'
          ? apiError.field
          : apiError?.code === 'INVALID_PHONE_NUMBER' || applicationCode === 'INVALID_PHONE_NUMBER' ? 'phone'
            : applicationCode === 'INVALID_CREDENTIALS' ? 'password' : undefined;
        const fieldMessage = applicationCode === 'INVALID_CREDENTIALS' ? t.invalidCredentials : apiError?.message;
        if (field && fieldMessage) {
          setAuthFieldErrors((current) => ({ ...current, [field]: fieldMessage }));
          return;
        }
        const message = apiError?.message ?? (applicationCode === 'INVALID_CREDENTIALS' ? t.invalidCredentials : typeof body.message === 'string' ? body.message : t.loadError);
        throw new Error(message);
      }
      setSignedIn(true); closeAuth(); setNotice(registering ? t.authRegisterSuccess : t.authLoginSuccess);
    } catch (cause) { setError(cause instanceof Error ? cause.message : t.loadError); }
    finally { setBusy(false); }
  }

  async function submitListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!signedIn) { setAuthOpen(true); setError(t.loginRequired); return; }
    const listingForm = event.currentTarget;
    const form = new FormData(listingForm);
    const value = (key: string) => String(form.get(key) ?? '');
    if (!value('country') || !value('city') || !value('unitCategory')) {
      setListingValidationAttempted(true);
      setError(t.listingRequired);
      window.requestAnimationFrame(() => listingForm.querySelector<HTMLButtonElement>('.premium-dropdown-trigger[aria-invalid="true"]')?.focus());
      return;
    }
    setBusy(true); setError('');
    try {
      await api('units', { method: 'POST', body: JSON.stringify({
        title: value('title'), description: value('description'), address: value('address'),
        photos: [value('photoUrl')], costPerDay: Number(value('costPerDay')),
        country: value('country'), city: value('city'), unitCategory: value('unitCategory'),
        roomsCount: Number(value('roomsCount')), adultsCount: Number(value('adultsCount')),
        kidsCount: Number(value('kidsCount')), hasInternetService: form.has('hasInternetService'),
        hasKitchen: form.has('hasKitchen'), hasPrivateGarage: form.has('hasPrivateGarage'),
        availability: true,
      }) });
      setNotice(t.listingSaved); listingForm.reset(); setListingCountry(''); setListingCity(''); setListingCategory(''); setListingValidationAttempted(false); await loadUnits(); setView('explore');
    } catch (cause) { setError(cause instanceof Error ? cause.message : t.loadError); }
    finally { setBusy(false); }
  }

  async function logOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setSignedIn(false); setView('explore');
  }

  async function setListingActive(unit: Unit) {
    setBusy(true);
    setError('');
    try {
      await api('units/' + unit.id + '/' + (unit.isActive ? 'deactivate' : 'activate'), {
        method: 'PATCH',
        body: JSON.stringify({ expectedVersion: unit.version }),
      });
      await loadMyUnits();
    } catch (cause) { setError(cause instanceof Error ? cause.message : t.loadError); }
    finally { setBusy(false); }
  }

  async function deleteListing(unit: Unit) {
    const confirmed = window.confirm(locale === 'ar' ? 'هل تريد حذف هذه الإقامة نهائيًا؟' : 'Delete this stay permanently?');
    if (!confirmed) return;
    setBusy(true);
    setError('');
    try {
      await api('units/' + unit.id, { method: 'DELETE', body: JSON.stringify({ expectedVersion: unit.version }) });
      await loadMyUnits();
    } catch (cause) { setError(cause instanceof Error ? cause.message : t.loadError); }
    finally { setBusy(false); }
  }

  function switchView(next: 'explore' | 'trips' | 'host') {
    setView(next); setError(''); setNotice('');
    if (next === 'trips') void loadBookings();
    if (next === 'host') void loadMyUnits();
    if (next === 'explore') void loadUnits();
  }

  function chooseDestination(destination: (typeof destinationSuggestions)[number]) {
    setQuery(localizeReference(destination.name, locale));
    setDestinationOpen(false);
    setActiveDestinationIndex(-1);
  }

  function handleDestinationKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' && destinationSuggestions.length) {
      event.preventDefault();
      setDestinationOpen(true);
      setActiveDestinationIndex((index) => Math.min(index < 0 ? 0 : index + 1, destinationSuggestions.length - 1));
    } else if (event.key === 'ArrowUp' && destinationSuggestions.length) {
      event.preventDefault();
      setDestinationOpen(true);
      setActiveDestinationIndex((index) => index < 0 ? destinationSuggestions.length - 1 : Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      if (destinationOpen && destinationSuggestions[activeDestinationIndex]) {
        event.preventDefault();
        chooseDestination(destinationSuggestions[activeDestinationIndex]);
      } else {
        setDestinationOpen(false);
        setSearchRevision((revision) => revision + 1);
      }
    } else if (event.key === 'Escape') {
      setDestinationOpen(false);
    }
  }

  const statusText = (status: string) => {
    const key = status.toLowerCase();
    if (key.includes('pending')) return t.statusPending;
    if (key.includes('confirm')) return t.statusConfirmed;
    if (key.includes('reject') || key.includes('declin')) return t.statusRejected;
    if (key.includes('cancel')) return t.statusCancelled;
    if (key.includes('complet')) return t.statusCompleted;
    return status;
  };

  async function updateBooking(event: FormEvent<HTMLFormElement>, booking: Booking) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const checkInValue = String(form.get('checkIn') ?? '');
    const checkOutValue = String(form.get('checkOut') ?? '');
    if (!checkInValue || !checkOutValue || checkOutValue <= checkInValue) {
      setError(bookingText.invalidDates);
      return;
    }
    setBookingMutationId(booking.id);
    setBookingMutationAction('edit');
    setError('');
    try {
      await api(`bookings/${booking.id}`, { method: 'PATCH', body: JSON.stringify({
        checkIn: checkInValue,
        checkOut: checkOutValue,
        adultsCount: Math.max(1, Number(form.get('adultsCount')) || 1),
        kidsCount: Math.max(0, Number(form.get('kidsCount')) || 0),
        notes: String(form.get('notes') ?? '').trim(),
      }) });
      setNotice(bookingText.updated);
      setEditingBookingId(null);
      await loadBookings('guest');
    } catch (cause) { setError(cause instanceof Error ? cause.message : t.loadError); }
    finally { setBookingMutationId(null); setBookingMutationAction(null); }
  }

  async function cancelBooking() {
    if (!cancellationTarget) return;
    const booking = cancellationTarget;
    setBookingMutationId(booking.id);
    setBookingMutationAction('cancel');
    setError('');
    try {
      await api(`bookings/${booking.id}/cancel`, { method: 'PATCH', body: JSON.stringify({ reason: cancellationReason.trim() }) });
      setCancellationTarget(null);
      setCancellationReason('');
      setNotice(bookingText.cancelled);
      await loadBookings('guest');
    } catch (cause) { setError(cause instanceof Error ? cause.message : t.loadError); }
    finally { setBookingMutationId(null); setBookingMutationAction(null); }
  }

  async function decideBooking(booking: Booking, status: 'CONFIRMED' | 'DECLINED') {
    setBookingMutationId(booking.id);
    setBookingMutationAction(status === 'CONFIRMED' ? 'confirm' : 'decline');
    setError('');
    try {
      await api(`bookings/${booking.id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setNotice(bookingText.decisionSaved);
      await loadBookings('host');
    } catch (cause) { setError(cause instanceof Error ? cause.message : t.loadError); }
    finally { setBookingMutationId(null); setBookingMutationAction(null); }
  }

  function closeAuth() {
    setAuthOpen(false);
    setAuthFieldErrors({});
    setPasswordVisible(false);
  }

  const activeFilterCount = [minPrice, maxPrice, roomsFilter, category].filter(Boolean).length
    + [internetFilter, kitchenFilter, garageFilter].filter(Boolean).length
    + Number(adultsCount > 0) + Number(kidsCount > 0);
  function clearSearchFilters() {
    const destinationWillChange = Boolean(query);
    setQuery(''); setMinPrice(''); setMaxPrice(''); setCategory(''); setRoomsFilter('');
    setAdults(0); setKids(0); setInternetFilter(false); setKitchenFilter(false); setGarageFilter(false);
    setFiltersOpen(false);
    if (!destinationWillChange) setSearchRevision((revision) => revision + 1);
  }
  const detailPhotos = selected?.photos?.filter((photo) => typeof photo === 'string' && photo.trim()) ?? [];
  const galleryImage = detailPhotos[galleryIndex] ?? detailPhotos[0];
  const checkDatesValid = Boolean(checkIn && checkOut && checkOut > checkIn);

  return (
    <main className="site-shell">
      <header className="topbar">
        <button className="brand" onClick={() => switchView('explore')} aria-label={t.explore}>
          <span className="brand-mark"><BrandMark /></span><span><b>{t.brand}</b><small>{t.tagline}</small></span>
        </button>
        {signedIn && <nav className="main-nav" aria-label={t.navigation}>
            <button type="button" className={view === 'trips' ? 'nav-link active' : 'nav-link'} aria-current={view === 'trips' ? 'page' : undefined} onClick={() => switchView('trips')}><NavIcon kind="trips" /><span>{t.trips}</span></button>
            <button type="button" className={view === 'host' ? 'nav-link active' : 'nav-link'} aria-current={view === 'host' ? 'page' : undefined} onClick={() => switchView('host')}><NavIcon kind="host" /><span>{t.host}</span></button>
        </nav>}
        <div className="top-actions">
          <button className="language-button" onClick={() => chooseLocale(locale === 'ar' ? 'en' : 'ar')}>{locale === 'ar' ? 'EN' : 'عربي'}</button>
          {signedIn ? <button type="button" className="account-button signed-in-account" onClick={logOut}><span className="avatar">M</span><span>{t.signOut}</span><LogoutIcon /></button> :
            <button className="account-button" onClick={() => { setRegistering(false); setAuthOpen(true); }}>{t.account}<span className="avatar">↗</span></button>}
        </div>
      </header>

      {view === 'explore' && <>
        <section className="hero">
          <SmartImage className="hero-image" src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=74" alt={t.heroImageAlt} sizes="100vw" width={1600} priority />
          <div className="hero-shade" />
          <div className="hero-content">
            <span className="eyebrow">{t.brand} <i /> {t.heroKicker}</span>
            <h1>{locale === 'ar' ? <>إقامتك القادمة<br />تبدأ من هنا.</> : <>Your next stay<br />starts here.</>}</h1>
            <p>{locale === 'ar' ? 'أماكن مختارة بعناية، وتفاصيل تجعل الرحلة أقرب إليك.' : 'Considered homes, thoughtful details, and room to feel at home.'}</p>
            <div className="hero-search">
              <div className="destination-field" ref={destinationFieldRef}>
                <label htmlFor="destination-search"><span>{t.where}</span><input id="destination-search" role="combobox" aria-autocomplete="list" aria-expanded={destinationOpen && referenceDataReady} aria-controls="destination-options" aria-activedescendant={destinationOpen && activeDestinationIndex >= 0 ? `destination-option-${activeDestinationIndex}` : undefined} value={query} onFocus={() => setDestinationOpen(true)} onChange={(event) => { setQuery(event.target.value); setActiveDestinationIndex(-1); setDestinationOpen(true); }} onKeyDown={handleDestinationKeyDown} placeholder={locale === 'ar' ? 'مدينة أو اسم إقامة' : 'City or stay name'} /></label>
                {destinationOpen && referenceDataReady && <div className="destination-suggestions" id="destination-options" role="listbox" aria-label={locale === 'ar' ? 'وجهات مقترحة' : 'Suggested destinations'}>
                  <div className="destination-suggestions-heading"><span>{locale === 'ar' ? (query.trim() ? 'نتائج البحث' : 'وجهات مقترحة') : (query.trim() ? 'Search results' : 'Suggested destinations')}</span><span>{formatNumber(destinationSuggestions.length, locale)}</span></div>
                  {destinationSuggestions.length ? destinationSuggestions.map((destination, index) => <button type="button" role="option" aria-selected={index === activeDestinationIndex} id={`destination-option-${index}`} className={index === activeDestinationIndex ? 'destination-option active' : 'destination-option'} key={`${destination.kind}-${destination.id}`} onMouseDown={(event) => event.preventDefault()} onMouseEnter={() => setActiveDestinationIndex(index)} onClick={() => chooseDestination(destination)}>
                    <span className="destination-option-icon"><DestinationPinIcon /></span>
                    <span className="destination-option-copy"><b>{localizeReference(destination.name, locale)}</b><small>{locale === 'ar' ? (destination.kind === 'city' ? 'مدينة' : 'دولة') : destination.kind === 'city' ? 'City' : 'Country'}</small></span>
                    <span className="destination-option-kind">{destination.kind === 'city' ? (locale === 'ar' ? 'مدينة' : 'City') : (locale === 'ar' ? 'دولة' : 'Country')}</span>
                  </button>) : <p className="destination-empty">{locale === 'ar' ? 'لا توجد وجهات مطابقة. يمكنك البحث بالاسم مباشرة.' : 'No matching destinations. You can search by name.'}</p>}
                </div>}
              </div>
              <DateRangePicker locale={locale} label={t.dates} checkInLabel={t.checkIn} checkOutLabel={t.checkOut} checkIn={checkIn} checkOut={checkOut} onChange={(nextCheckIn, nextCheckOut) => { setCheckIn(nextCheckIn); setCheckOut(nextCheckOut); }} />
              <button className="filter-trigger" type="button" onClick={() => setFiltersOpen(true)} aria-label={t.filters}><span>☷</span>{t.filter}{activeFilterCount > 0 && <b className="filter-count">{formatNumber(activeFilterCount, locale)}</b>}</button>
              <button className="search-submit" onClick={() => setSearchRevision((revision) => revision + 1)} aria-label={t.search}><SearchIcon /></button>
            </div>
          </div>
          <span className="hero-caption">{t.heroCaption}</span>
        </section>

        <section className="content-section">
          <div className="section-heading">
            <div><span className="eyebrow dark">{t.curated}</span><h2>{t.homes}</h2><p>{formatStayCount(unitsTotal, locale)}{(adultsCount > 0 || kidsCount > 0) ? '+' : ''}</p></div>
            <button className="subtle-button" onClick={clearSearchFilters}>{t.all}<span>↗</span></button>
          </div>
          {(query || activeFilterCount > 0) && <div className="applied-filters" aria-label={locale === 'ar' ? 'الفلاتر المختارة' : 'Applied filters'}>
            {query && <button type="button" className="filter-chip" onClick={() => setQuery('')}><span>{query}</span><b aria-hidden="true">×</b></button>}
            {minPrice && <button type="button" className="filter-chip" onClick={() => { setMinPrice(''); setSearchRevision((revision) => revision + 1); }}><span>{locale === 'ar' ? 'من' : 'From'} {formatMoney(Number(minPrice), locale)}</span><b aria-hidden="true">×</b></button>}
            {maxPrice && <button type="button" className="filter-chip" onClick={() => { setMaxPrice(''); setSearchRevision((revision) => revision + 1); }}><span>{locale === 'ar' ? 'حتى' : 'Up to'} {formatMoney(Number(maxPrice), locale)}</span><b aria-hidden="true">×</b></button>}
            {roomsFilter && <button type="button" className="filter-chip" onClick={() => { setRoomsFilter(''); setSearchRevision((revision) => revision + 1); }}><span>{formatNumber(Number(roomsFilter), locale)} {t.bedrooms}</span><b aria-hidden="true">×</b></button>}
            {category && <button type="button" className="filter-chip" onClick={() => { setCategory(''); setSearchRevision((revision) => revision + 1); }}><span>{localizeReference(categories.find((item) => item.id === category)?.name ?? t.category, locale)}</span><b aria-hidden="true">×</b></button>}
            {internetFilter && <button type="button" className="filter-chip" onClick={() => { setInternetFilter(false); setSearchRevision((revision) => revision + 1); }}><span>{t.internet}</span><b aria-hidden="true">×</b></button>}
            {kitchenFilter && <button type="button" className="filter-chip" onClick={() => { setKitchenFilter(false); setSearchRevision((revision) => revision + 1); }}><span>{t.kitchen}</span><b aria-hidden="true">×</b></button>}
            {garageFilter && <button type="button" className="filter-chip" onClick={() => { setGarageFilter(false); setSearchRevision((revision) => revision + 1); }}><span>{t.garage}</span><b aria-hidden="true">×</b></button>}
            {adultsCount > 0 && <button type="button" className="filter-chip" onClick={() => { setAdults(0); setSearchRevision((revision) => revision + 1); }}><span>{formatNumber(adultsCount, locale)} {t.adultsFilter}</span><b aria-hidden="true">×</b></button>}
            {kidsCount > 0 && <button type="button" className="filter-chip" onClick={() => { setKids(0); setSearchRevision((revision) => revision + 1); }}><span>{formatNumber(kidsCount, locale)} {t.childrenFilter}</span><b aria-hidden="true">×</b></button>}
            <button type="button" className="clear-filters-link" onClick={clearSearchFilters}>{t.clearFilters}</button>
          </div>}          {error && <div className="message error-message" role="alert">{error}</div>}
          {notice && <div className="message success-message" role="status">{notice}<button onClick={() => setNotice('')} aria-label={t.close}>×</button></div>}
          {loading ? <div className="loading-grid">{[1, 2, 3, 4].map((item) => <div className="skeleton-card" key={item}><div /><span /><i /></div>)}</div> :
            units.length ? <div className="stay-grid">{units.map((unit) => <article className="stay-card" key={unit.id}>
              <button className="stay-card-open" onMouseEnter={() => preloadSmartImage(unit.photos?.[0])} onFocus={() => preloadSmartImage(unit.photos?.[0])} onClick={() => void openUnit(unit)}>
                <div className="stay-photo">
                  <SmartImage src={unit.photos?.[0]} alt={displayUnitTitle(unit.title, locale, locationName(unit))} sizes="(max-width: 700px) 90vw, (max-width: 1100px) 45vw, 30vw" width={640} />
                  <span className="photo-label">{isPreviewUnit(unit.title, unit.description) ? t.previewOnly : unit.availability ? (locale === 'ar' ? 'متاح للحجز' : 'Available') : ''}</span>
                </div>
                <span className="stay-meta"><b>{locationName(unit)}</b><span>{typeof unit.rating === 'number' ? '★ ' + unit.rating.toFixed(1) : t.newStay}</span></span>
                <span className="stay-description">{displayUnitTitle(unit.title, locale, locationName(unit))}</span>
                <span className="stay-capacity">{formatBedrooms(unit.roomsCount, locale)} · {formatGuests(unit.adultsCount, locale)}</span>
                <span className="stay-price"><b>{formatMoney(unit.costPerDay, locale)}</b> / {t.night}</span>
              </button>
              <button type="button" className={favoriteIds.has(unit.id) ? 'heart favorite-active' : 'heart'} aria-label={favoriteIds.has(unit.id) ? t.removeSavedStay : t.saveStay} aria-pressed={favoriteIds.has(unit.id)} onClick={() => toggleFavorite(unit.id)}>{favoriteIds.has(unit.id) ? '♥' : '♡'}</button>
            </article>)}</div> : <div className="empty-state"><span className="empty-mark">⌂</span><h3>{t.noResults}</h3><p>{t.noResultsHint}</p><button className="outline-button" onClick={clearSearchFilters}>{t.clearFilters}</button></div>}
          {!loading && unitsPageCount > 1 && <nav className="pagination" aria-label={locale === 'ar' ? 'صفحات الإقامات' : 'Stay pages'}>
            <button className="pagination-arrow" type="button" disabled={unitsPage <= 1} onClick={() => { void loadUnitsRef.current(unitsPage - 1); document.querySelector('.content-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} aria-label={locale === 'ar' ? 'الصفحة السابقة' : 'Previous page'}>{locale === 'ar' ? 'السابق' : 'Previous'} <span aria-hidden="true">{locale === 'ar' ? '←' : '←'}</span></button>
            <div className="pagination-pages">{paginationItems(unitsPage, unitsPageCount).map((item) => typeof item === 'number' ? <button key={item} type="button" className={item === unitsPage ? 'pagination-page is-current' : 'pagination-page'} aria-current={item === unitsPage ? 'page' : undefined} onClick={() => { void loadUnitsRef.current(item); document.querySelector('.content-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>{formatNumber(item, locale)}</button> : <span className="pagination-gap" key={item}>…</span>)}</div>
            <button className="pagination-arrow" type="button" disabled={unitsPage >= unitsPageCount} onClick={() => { void loadUnitsRef.current(unitsPage + 1); document.querySelector('.content-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} aria-label={locale === 'ar' ? 'الصفحة التالية' : 'Next page'}><span aria-hidden="true">{locale === 'ar' ? '→' : '→'}</span> {locale === 'ar' ? 'التالي' : 'Next'}</button>
          </nav>}
        </section>
      </>}

      {filtersOpen && <div className="filter-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setFiltersOpen(false)}>
        <section className="filter-panel" role="dialog" aria-modal="true" aria-labelledby="filter-title">
          <header className="filter-header"><div><span className="eyebrow dark">{t.curated}</span><h2 id="filter-title">{t.filters}</h2></div><button className="modal-close" onClick={() => setFiltersOpen(false)} aria-label={t.close}>×</button></header>
          <div className="filter-content">
            <p className="filter-note">{t.datesHint} · {formatDate(checkIn, locale)} — {formatDate(checkOut, locale)}</p>
            <div className="filter-fields">
              <label className="field"><span>{t.adultsFilter}</span><input type="number" min="0" max="20" inputMode="numeric" value={adultsCount} onChange={(event) => setAdults(Math.min(20, Math.max(0, Number(event.target.value) || 0)))} /></label>
              <label className="field"><span>{t.childrenFilter}</span><input type="number" min="0" max="20" inputMode="numeric" value={kidsCount} onChange={(event) => setKids(Math.max(0, Number(event.target.value)))} /></label>
              <label className="field"><span>{t.minPrice}</span><input type="number" min="0" inputMode="numeric" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="—" /></label>
              <label className="field"><span>{t.maxPrice}</span><input type="number" min="0" inputMode="numeric" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="—" /></label>
              <label className="field"><span>{t.roomsFilter}</span><PremiumDropdown value={roomsFilter} onChange={setRoomsFilter} options={[{ value: '', label: t.all }, ...[1, 2, 3, 4, 5].map((count) => ({ value: String(count), label: formatNumber(count, locale) }))]} /></label>
              <label className="field"><span>{t.category}</span><PremiumDropdown value={category} onChange={setCategory} options={[{ value: '', label: t.all }, ...categories.map((item) => ({ value: item.id, label: localizeReference(item.name, locale) }))]} /></label>
            </div>
            <div className="filter-amenities"><h3>{t.features}</h3>
              <label><input type="checkbox" checked={internetFilter} onChange={(event) => setInternetFilter(event.target.checked)} /><span>{t.internet}</span><i>⌁</i></label>
              <label><input type="checkbox" checked={kitchenFilter} onChange={(event) => setKitchenFilter(event.target.checked)} /><span>{t.kitchen}</span><i>⌂</i></label>
              <label><input type="checkbox" checked={garageFilter} onChange={(event) => setGarageFilter(event.target.checked)} /><span>{t.garage}</span><i>▣</i></label>
            </div>
          </div>
          <footer className="filter-footer"><button className="text-button" onClick={() => { setMinPrice(''); setMaxPrice(''); setRoomsFilter(''); setCategory(''); setAdults(0); setKids(0); setInternetFilter(false); setKitchenFilter(false); setGarageFilter(false); }}>{t.clearFilters}</button><button className="primary-button" onClick={() => { setFiltersOpen(false); setSearchRevision((revision) => revision + 1); }}>{t.applyFilters}<span aria-hidden="true">↗</span></button></footer>
        </section>
      </div>}

      {view === 'trips' && <section className="workspace-section"><div className="workspace-heading"><div><span className="eyebrow dark">{t.journalKicker}</span><h1>{t.tripsTitle}</h1></div><button className="outline-button" onClick={() => switchView('explore')}>{t.explore} ↗</button></div>
        <div className="switch-tabs"><button className={party === 'guest' ? 'selected' : ''} disabled={bookingsLoading || bookingMutationId !== null} onClick={() => { setParty('guest'); setEditingBookingId(null); setBookings([]); void loadBookings('guest'); }}>{t.asGuest}</button><button className={party === 'host' ? 'selected' : ''} disabled={bookingsLoading || bookingMutationId !== null} onClick={() => { setParty('host'); setEditingBookingId(null); setBookings([]); void loadBookings('host'); }}>{t.asHost}</button></div>
        {error && <div className="message error-message" role="alert">{error}</div>}
        {bookingsLoading ? <div className="booking-list booking-skeleton-list" aria-label={bookingText.loading} aria-busy="true">{[0, 1, 2].map((item) => <div className="booking-skeleton" key={item}><span /><div><i /><i /><i /></div></div>)}</div> : error ? <div className="empty-state"><h3>{t.loadError}</h3><button className="outline-button" onClick={() => void loadBookings(party)}>{bookingText.retry}</button></div> : bookings.length ? <div className="booking-list">{bookings.map((booking) => {
          const title = typeof booking.unit === 'object' ? booking.unit?.title : undefined;
          const image = typeof booking.unit === 'object' ? booking.unit?.photos?.[0] : undefined;
          const safeTitle = title ? displayUnitTitle(title, locale, 'Alexandria') : t.stays;
          const status = booking.status.toLowerCase();
          const pending = status.includes('pending');
          const guestCanCancel = party === 'guest' && (pending || status.includes('confirm'));
          const isMutating = bookingMutationId === booking.id;
          return <article className="booking-card booking-card-rich" key={booking.id} aria-busy={isMutating}>
            <div className="booking-card-main"><div className="booking-thumb"><SmartImage src={image} alt={safeTitle} sizes="180px" width={360} /></div><div className="booking-info"><span className={`status-pill status-${status}`}>{statusText(booking.status)}</span><h3>{safeTitle}</h3><p>{formatDate(booking.checkIn, locale)} <span aria-hidden="true">—</span> {formatDate(booking.checkOut, locale)}</p><div className="booking-meta"><span>{formatNumber(booking.adultsCount ?? 1, locale)} {t.adults}</span><span>{formatNumber(booking.kidsCount ?? 0, locale)} {t.children}</span></div><b>{formatMoney(booking.totalAmount, locale)}</b></div></div>
            {(party === 'guest' && (pending || guestCanCancel) || party === 'host' && pending) && <div className="booking-actions">
              {party === 'guest' && pending && <button className="outline-button" disabled={bookingMutationId !== null} onClick={() => { setError(''); setEditingBookingId(editingBookingId === booking.id ? null : booking.id); }}>{bookingText.edit}</button>}
              {guestCanCancel && <button className="danger-outline-button" disabled={bookingMutationId !== null} onClick={() => { setCancellationTarget(booking); setCancellationReason(''); setError(''); }}>{bookingText.cancel}</button>}
              {party === 'host' && pending && <><button className="primary-button" disabled={bookingMutationId !== null} onClick={() => void decideBooking(booking, 'CONFIRMED')}>{isMutating && bookingMutationAction === 'confirm' ? <><span className="booking-action-spinner" />{bookingText.loading}</> : bookingText.accept}</button><button className="danger-outline-button" disabled={bookingMutationId !== null} onClick={() => void decideBooking(booking, 'DECLINED')}>{isMutating && bookingMutationAction === 'decline' ? <><span className="booking-action-spinner" />{bookingText.loading}</> : bookingText.decline}</button></>}
            </div>}
            {editingBookingId === booking.id && <form className="booking-edit-form" onSubmit={(event) => void updateBooking(event, booking)}>
              <label className="field"><span>{t.checkIn}</span><input name="checkIn" type="date" required defaultValue={booking.checkIn.slice(0, 10)} /></label>
              <label className="field"><span>{t.checkOut}</span><input name="checkOut" type="date" required defaultValue={booking.checkOut.slice(0, 10)} /></label>
              <label className="field"><span>{t.adults}</span><input name="adultsCount" type="number" min="1" required defaultValue={booking.adultsCount ?? 1} /></label>
              <label className="field"><span>{t.children}</span><input name="kidsCount" type="number" min="0" defaultValue={booking.kidsCount ?? 0} /></label>
              <label className="field wide"><span>{t.notes}</span><textarea name="notes" rows={2} maxLength={1000} defaultValue={booking.notes ?? ''} /></label>
              <button className="primary-button" type="submit" disabled={bookingMutationId !== null}>{isMutating && bookingMutationAction === 'edit' ? <><span className="booking-action-spinner" />{bookingText.loading}</> : bookingText.save}</button>
            </form>}
          </article>;
        })}</div> : <div className="empty-state"><span className="empty-mark">✳</span><h3>{bookingText.empty}</h3><p>{locale === 'ar' ? 'ابدأ باكتشاف مكان يناسب خططك.' : 'Find a place that fits the way you want to travel.'}</p><button className="primary-button" onClick={() => switchView('explore')}>{t.explore}</button></div>}
      </section>}

      {view === 'host' && <section className="workspace-section"><div className="workspace-heading"><div><span className="eyebrow dark">{t.hostKicker}</span><h1>{t.myPlaces}</h1><p>{locale === 'ar' ? 'شارك مكانًا تحبه مع ضيوف يبحثون عن تجربة مختلفة.' : 'Share a place you love with guests looking for something different.'}</p></div><button className="primary-button" onClick={() => { if (!signedIn) { setAuthOpen(true); setError(t.loginRequired); } else document.getElementById('listing-form')?.scrollIntoView({ behavior: 'smooth' }); }}>＋ {t.addPlace}</button></div>
        {error && <div className="message error-message" role="alert">{error}</div>}
        {myUnits.length > 0 && <div className="host-list">{myUnits.map((unit) => <article className="host-unit" key={unit.id}>
          <div className="host-thumb"><SmartImage src={unit.photos?.[0]} alt={displayUnitTitle(unit.title, locale, locationName(unit))} sizes="140px" width={320} /></div>
          <div className="host-unit-copy"><span className={unit.isActive ? 'host-state active-state' : 'host-state'}>{unit.isActive ? t.active : t.paused}</span><h3>{displayUnitTitle(unit.title, locale, locationName(unit))}</h3><p>{locationName(unit)} · {formatMoney(unit.costPerDay, locale)} / {t.night}</p></div>
          <div className="host-unit-actions"><button className="outline-button" disabled={busy} onClick={() => void setListingActive(unit)}>{unit.isActive ? t.pauseListing : t.activateListing}</button><button className="danger-button" disabled={busy} onClick={() => void deleteListing(unit)}>{t.deleteListing}</button></div>
        </article>)}</div>}
        <form id="listing-form" className="listing-form" onSubmit={submitListing}><div className="form-title"><span className="eyebrow dark">{t.hostFormKicker}</span><h2>{t.createListing}</h2></div>
          <div className="form-grid"><label className="field wide"><span>{t.title}</span><input name="title" minLength={5} maxLength={100} required /></label><label className="field wide"><span>{t.description}</span><textarea name="description" rows={3} required /></label><label className="field wide"><span>{t.address}</span><input name="address" required /></label><label className="field wide"><span>{t.photoUrl}</span><input name="photoUrl" type="url" required placeholder="https://…" /></label>
            <label className="field"><span>{t.country}</span><PremiumDropdown name="country" required invalid={listingValidationAttempted && !listingCountry} value={listingCountry} onChange={(value) => { setListingCountry(value); setError(''); }} options={[{ value: '', label: t.chooseOption }, ...countries.map((item) => ({ value: item.id, label: localizeReference(item.name, locale) }))]} /></label>
            <label className="field"><span>{t.city}</span><PremiumDropdown name="city" required invalid={listingValidationAttempted && !listingCity} value={listingCity} onChange={(value) => { setListingCity(value); setError(''); }} options={[{ value: '', label: t.chooseOption }, ...cities.map((item) => ({ value: item.id, label: localizeReference(item.name, locale) }))]} /></label>
            <label className="field"><span>{t.category}</span><PremiumDropdown name="unitCategory" required invalid={listingValidationAttempted && !listingCategory} value={listingCategory} onChange={(value) => { setListingCategory(value); setError(''); }} options={[{ value: '', label: t.chooseOption }, ...categories.map((item) => ({ value: item.id, label: localizeReference(item.name, locale) }))]} /></label>
            <label className="field"><span>{t.price}</span><input name="costPerDay" type="number" min="1" required /></label>
            <label className="field"><span>{t.rooms}</span><input name="roomsCount" type="number" min="1" defaultValue="1" required /></label>
            <label className="field"><span>{t.adults}</span><input name="adultsCount" type="number" min="1" defaultValue="2" required /></label>
            <label className="field"><span>{t.children}</span><input name="kidsCount" type="number" min="0" defaultValue="0" required /></label></div>
          <div className="amenity-checks"><label><input type="checkbox" name="hasInternetService" /> {t.internet}</label><label><input type="checkbox" name="hasKitchen" /> {t.kitchen}</label><label><input type="checkbox" name="hasPrivateGarage" /> {t.garage}</label></div>
          {error && <div className="message error-message" role="alert">{error}</div>}<button className="primary-button" disabled={busy}>{busy ? t.loading : t.publish}</button>
        </form>
      </section>}

      <footer className="site-footer">
        <div className="footer-main">
          <button type="button" className="footer-brand" onClick={() => switchView('explore')} aria-label={t.explore}>
            <span className="brand-mark"><BrandMark /></span>
            <span className="footer-brand-copy"><b>{t.brand}</b><small>{t.tagline}</small></span>
          </button>
          <p className="footer-promise">{locale === 'ar' ? 'إقامات مختارة لتجارب تبقى.' : 'Considered stays for lasting memories.'}</p>
          <nav className="footer-nav" aria-label={t.navigation}>
            <span className="footer-section-title">{locale === 'ar' ? 'اكتشف' : 'Explore'}</span>
            <button type="button" onClick={() => switchView('explore')}>{t.explore}</button>
            {signedIn && <>
              <button type="button" onClick={() => switchView('trips')}>{t.trips}</button>
              <button type="button" onClick={() => switchView('host')}>{t.host}</button>
            </>}
          </nav>
        </div>
        <div className="footer-bottom">
          <span>© {new Intl.DateTimeFormat(locale, { year: 'numeric' }).format(new Date())} {t.brand}</span>
          <span>{locale === 'ar' ? 'صُممت كل إقامة لتشبه حكاية تستحق أن تُعاش.' : 'Every stay is the start of a story worth keeping.'}</span>
          <button type="button" onClick={() => chooseLocale(locale === 'ar' ? 'en' : 'ar')}>{locale === 'ar' ? 'English' : 'العربية'}</button>
        </div>
      </footer>

      {cancellationTarget && <div className="modal-backdrop booking-confirm-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setCancellationTarget(null)}>
        <section className="booking-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="booking-cancel-title">
          <span className="booking-confirm-icon" aria-hidden="true">!</span>
          <span className="eyebrow dark">{bookingText.cancel}</span>
          <h2 id="booking-cancel-title">{bookingText.cancelPrompt}</h2>
          <p>{typeof cancellationTarget.unit === 'object' ? cancellationTarget.unit?.title : t.stays}</p>
          <label className="field"><span>{bookingText.reason}</span><textarea rows={3} maxLength={500} value={cancellationReason} onChange={(event) => setCancellationReason(event.target.value)} /></label>
          {error && <div className="message error-message" role="alert">{error}</div>}
          <div className="booking-confirm-actions"><button className="outline-button" disabled={bookingMutationId !== null} onClick={() => { setCancellationTarget(null); setError(''); }}>{bookingText.keep}</button><button className="danger-solid-button" disabled={bookingMutationId !== null} onClick={() => void cancelBooking()}>{bookingMutationId === cancellationTarget.id && bookingMutationAction === 'cancel' ? <><span className="booking-action-spinner" />{bookingText.loading}</> : bookingText.confirmCancel}</button></div>
        </section>
      </div>}

      {selected && <div className="modal-backdrop detail-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}>
        <section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="stay-title"><button className="modal-close" onClick={() => setSelected(null)} aria-label={t.close}>×</button>
          <div className={detailPhotos.length > 1 ? 'detail-gallery has-thumbnails' : 'detail-gallery'}>
            <div className="detail-image"><SmartImage src={galleryImage} alt={displayUnitTitle(selected.title, locale, locationName(selected))} sizes="(max-width: 800px) 100vw, 60vw" width={1400} previewWidth={640} priority /></div>
            {detailPhotos.length > 1 && <div className={detailPhotos.length < 4 ? 'detail-thumbnails few-thumbnails' : 'detail-thumbnails'}>{detailPhotos.map((photo, index) => <button key={`${photo}-${index}`} className={index === galleryIndex ? 'detail-thumbnail is-active' : 'detail-thumbnail'} aria-label={locale === 'ar' ? `عرض الصورة ${formatNumber(index + 1, locale)}` : `Show photo ${index + 1}`} aria-pressed={index === galleryIndex} onClick={() => setGalleryIndex(index)}><SmartImage src={photo} alt="" sizes="(max-width: 800px) 24vw, 20vw" width={360} /></button>)}</div>}
          </div>
          <div className="detail-body"><span className="eyebrow dark">{locationName(selected)}</span><h2 id="stay-title">{displayUnitTitle(selected.title, locale, locationName(selected))}</h2><p className="detail-capacity">{formatBedrooms(selected.roomsCount, locale)} · {formatGuests(selected.adultsCount, locale)} · {locationName(selected)}</p><p className="detail-description">{displayUnitDescription(selected.description, locale)}</p>
            <div className="amenity-row"><span>{selected.hasInternetService ? '◉ ' + t.internet : ''}</span><span>{selected.hasKitchen ? '⌂ ' + t.kitchen : ''}</span><span>{selected.hasPrivateGarage ? '▣ ' + t.garage : ''}</span></div>
            {isPreviewUnit(selected.title, selected.description) ? <div className="preview-alert" role="note"><span>◷</span><div><b>{t.previewOnly}</b><p>{t.previewMessage}</p></div></div> : <form className="booking-panel" onSubmit={requestBooking}><h3>{t.reserve}</h3><div className="booking-date-range"><DateRangePicker locale={locale} label={t.dates} checkInLabel={t.checkIn} checkOutLabel={t.checkOut} checkIn={checkIn} checkOut={checkOut} onChange={(nextCheckIn, nextCheckOut) => { setCheckIn(nextCheckIn); setCheckOut(nextCheckOut); setEstimate(null); }} variant="booking" /></div>
              <div className="date-grid"><label className="field"><span>{t.adults}</span><input type="number" min="1" max={selected.adultsCount} value={bookingAdultsCount} onChange={(event) => setBookingAdults(Math.min(selected.adultsCount, Math.max(1, Number(event.target.value) || 1)))} /></label><label className="field"><span>{t.children}</span><input type="number" min="0" max={selected.kidsCount} value={kidsCount} onChange={(event) => setKids(Math.min(selected.kidsCount, Math.max(0, Number(event.target.value) || 0)))} /></label></div>
              <button type="button" className="outline-button full-button" disabled={busy || !checkDatesValid} onClick={() => void checkPrice()}>{busy ? t.loading : t.check}</button>
              {estimate && <div className="estimate"><p className={estimate.available ? 'available' : 'unavailable'}>{estimate.available ? '✓ ' + t.available : '× ' + t.unavailable}</p><div><span>{t.subtotal}</span><span>{formatMoney(estimate.bookingAmount, locale)}</span></div><div><span>{t.tax} ({formatNumber(estimate.vat, locale)}%)</span><span>{formatMoney(estimate.vatAmount, locale)}</span></div><div className="estimate-total"><b>{t.total}</b><b>{formatMoney(estimate.totalAmount, locale)}</b></div></div>}
              <label className="field notes-field"><span>{t.notes}</span><textarea name="notes" rows={2} maxLength={1000} /></label>
              {error && <div className="message error-message" role="alert">{error}</div>}
              <button className="primary-button full-button" disabled={busy || !estimate?.available || !checkDatesValid}>{busy ? t.loading : t.booking}</button>
            </form>}
          </div>
        </section>
      </div>}

      {authOpen && <div className="modal-backdrop auth-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeAuth()}>
        <section className={`auth-modal${locale === 'ar' ? ' auth-modal-ar' : ''}${registering ? ' auth-modal-registering' : ''}`} role="dialog" aria-modal="true" aria-labelledby="auth-title" aria-describedby="auth-description">
          <aside className="auth-story" aria-label={t.authWelcome}>
            <div className="auth-story-top"><span className="auth-story-mark"><BrandMark /></span><span>{t.brand}<small>{t.tagline}</small></span></div>
            <div className="auth-story-art" aria-hidden="true">
              <svg viewBox="0 0 440 220" fill="none"><path className="auth-route-line" d="M20 171C80 168 66 90 143 106S218 188 280 127s71-78 140-68"/><circle className="auth-route-stop" cx="20" cy="171" r="5"/><circle className="auth-route-stop" cx="143" cy="106" r="5"/><circle className="auth-route-stop" cx="280" cy="127" r="5"/><circle className="auth-route-stop auth-route-stop-end" cx="420" cy="59" r="7"/><path className="auth-route-progress" pathLength="1" d="M20 171C80 168 66 90 143 106S218 188 280 127s71-78 140-68"/><path className="auth-route-glow" pathLength="1" d="M20 171C80 168 66 90 143 106S218 188 280 127s71-78 140-68"/><circle className="auth-route-runner" r="4"><animateMotion dur="2.8s" begin=".25s" fill="freeze" calcMode="paced" path="M20 171C80 168 66 90 143 106S218 188 280 127s71-78 140-68"/></circle></svg>
              <div className="auth-story-stamp"><span>01</span><i aria-hidden="true">✳</i><span>{locale === 'ar' ? 'رحلتك' : 'YOUR JOURNEY'}</span></div>
            </div>
            <div className="auth-story-copy"><span className="auth-story-kicker">{t.heroKicker}</span><h2>{t.authStoryTitle}</h2><p>{t.authStoryBody}</p></div>
            <div className="auth-story-foot"><span className="auth-lock" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></span><span>{t.authPrivacy}</span></div>
          </aside>
          <div className="auth-content">
            <button type="button" className="modal-close auth-close" onClick={closeAuth} aria-label={t.close}>×</button>
            <div className="auth-heading"><span className="eyebrow dark">{t.brand} <i aria-hidden="true" /> {t.authWelcome}</span><h1 id="auth-title">{registering ? t.register : t.login}</h1><p id="auth-description">{t.authIntro}</p></div>
            <div className="auth-mode-switch" aria-label={locale === 'ar' ? 'نوع الحساب' : 'Account action'}>
              <button type="button" onClick={() => { setRegistering(false); setError(''); setAuthFieldErrors({}); setPasswordVisible(false); }} aria-pressed={!registering}>{t.login}</button>
              <button type="button" onClick={() => { setRegistering(true); setError(''); setAuthFieldErrors({}); setPasswordVisible(false); }} aria-pressed={registering}>{t.register}</button>
            </div>
            <form noValidate onSubmit={submitAuth} className="auth-form" aria-busy={busy} onChange={(event) => {
              if (error) setError('');
              const field = event.target;
              if (field instanceof HTMLInputElement && authFieldErrors[field.name as AuthFieldName]) {
                const message = authFieldError(field.name, event.currentTarget);
                setAuthFieldErrors((current) => ({ ...current, [field.name]: message }));
              }
              if (registering && authFieldErrors.confirmPassword && field instanceof HTMLInputElement && field.name === 'password') {
                const message = authFieldError('confirmPassword', event.currentTarget);
                setAuthFieldErrors((current) => ({ ...current, confirmPassword: message }));
              }
            }}>
              {registering && <>
                <label className="field"><span>{t.name}</span><input name="name" autoComplete="name" placeholder={t.namePlaceholder} minLength={2} maxLength={50} required data-autofocus onBlur={handleAuthFieldBlur} aria-invalid={Boolean(authFieldErrors.name)} aria-describedby={authFieldErrors.name ? 'auth-name-error' : undefined} />{authFieldErrors.name && <small className="auth-field-error" id="auth-name-error">{authFieldErrors.name}</small>}</label>
                <div className="date-grid auth-phone-grid">
                  <label className="field"><span>{t.countryCode}</span>
                    <input type="hidden" name="countryCode" value={selectedDialCountry.dialCode} />
                    <div className="country-picker-wrap" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDialPickerOpen(false); }} onKeyDown={(event) => { if (event.key === 'Escape') { setDialPickerOpen(false); setDialSearch(''); } }}>
                      <button type="button" className="country-picker-button" data-country-picker data-invalid={Boolean(authFieldErrors.countryCode)} aria-haspopup="listbox" aria-expanded={dialPickerOpen} aria-describedby={authFieldErrors.countryCode ? 'auth-country-code-error' : undefined} onClick={() => setDialPickerOpen((open) => !open)}>
                        <span className="country-picker-flag" aria-hidden="true">{countryFlag(selectedDialCountry.code)}</span>
                        <span className="country-picker-name">{selectedDialCountry.name}</span>
                        <span className="country-picker-code" dir="ltr">{selectedDialCountry.dialCode}</span>
                        <svg className="country-picker-chevron" viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7.5 5 5 5-5" /></svg>
                      </button>
                      {dialPickerOpen && <div className="country-picker-popover">
                        <label className="country-picker-search"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4 4"/></svg><input autoFocus type="search" value={dialSearch} onChange={(event) => setDialSearch(event.target.value)} placeholder={t.searchCountry} aria-label={t.searchCountry} /></label>
                        <div className="country-picker-list" role="listbox" aria-label={t.countryCode}>
                          {filteredDialCountries.length ? filteredDialCountries.map((country) => <button type="button" role="option" aria-selected={country.code === dialCountry} key={country.code} className="country-picker-option" onClick={(event) => {
                            setDialCountry(country.code); setDialPickerOpen(false); setDialSearch('');
                            const form = event.currentTarget.closest('form');
                            if (form && authFieldErrors.phone) {
                              const phoneValue = String(new FormData(form).get('phone') ?? '').trim();
                              const message = phoneValue && phoneToolsRef.current && !phoneToolsRef.current.parsePhoneNumberFromString(`${country.dialCode}${phoneValue}`)?.isValid() ? t.phoneInvalid : phoneValue ? undefined : t.phoneRequired;
                              setAuthFieldErrors((current) => { const next = { ...current }; delete next.countryCode; if (message) next.phone = message; else delete next.phone; return next; });
                            } else setAuthFieldErrors((current) => { const next = { ...current }; delete next.countryCode; return next; });
                          }}><span className="country-picker-option-flag" aria-hidden="true">{countryFlag(country.code)}</span><span className="country-picker-option-name">{country.name}</span><span className="country-picker-option-iso">{country.code}</span><span className="country-picker-option-code" dir="ltr">{country.dialCode}</span></button>) : <p className="country-picker-empty">{phoneTools ? t.noCountriesFound : t.loading}</p>}
                        </div>
                      </div>}
                    </div>
                    {authFieldErrors.countryCode && <small className="auth-field-error" id="auth-country-code-error">{authFieldErrors.countryCode}</small>}
                  </label>
                  <label className="field"><span>{t.phone}</span><input name="phone" autoComplete="tel-national" inputMode="tel" placeholder={t.phonePlaceholder} required onBlur={handleAuthFieldBlur} aria-invalid={Boolean(authFieldErrors.phone)} aria-describedby={authFieldErrors.phone ? 'auth-phone-error auth-phone-hint' : 'auth-phone-hint'} />{authFieldErrors.phone && <small className="auth-field-error" id="auth-phone-error">{authFieldErrors.phone}</small>}<small className="auth-field-hint" id="auth-phone-hint">{t.phoneHint}</small></label>
                </div>
              </>}
              <label className="field"><span>{t.email}</span><input name="email" type="email" autoComplete="email" placeholder={t.emailPlaceholder} required data-autofocus={!registering ? '' : undefined} onBlur={handleAuthFieldBlur} aria-invalid={Boolean(authFieldErrors.email)} aria-describedby={authFieldErrors.email ? 'auth-email-error' : undefined} />{authFieldErrors.email && <small className="auth-field-error" id="auth-email-error">{authFieldErrors.email}</small>}</label>
              <label className="field"><span>{t.password}</span><span className="auth-password-control" data-invalid={Boolean(authFieldErrors.password)}><input id="auth-password" name="password" type={passwordVisible ? 'text' : 'password'} autoComplete={registering ? 'new-password' : 'current-password'} placeholder={t.passwordPlaceholder} minLength={registering ? 8 : undefined} maxLength={registering ? 128 : undefined} required aria-describedby={[registering ? 'auth-password-hint' : '', authFieldErrors.password ? 'auth-password-error' : ''].filter(Boolean).join(' ') || undefined} onBlur={handleAuthFieldBlur} aria-invalid={Boolean(authFieldErrors.password)} /><button type="button" className="password-visibility" onClick={() => setPasswordVisible(!passwordVisible)} aria-label={passwordVisible ? t.hidePassword : t.showPassword} title={passwordVisible ? t.hidePassword : t.showPassword}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.3-6 9.5-6 9.5 6 9.5 6-3.3 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.7"/>{passwordVisible && <path d="m4 4 16 16"/>}</svg></button></span>{registering && <small id="auth-password-hint" className="auth-field-hint">{t.passwordHint}</small>}{authFieldErrors.password && <small className="auth-field-error" id="auth-password-error">{authFieldErrors.password}</small>}</label>
              {registering && <label className="field"><span>{t.confirmPassword}</span><span className="auth-password-control" data-invalid={Boolean(authFieldErrors.confirmPassword)}><input name="confirmPassword" type={passwordVisible ? 'text' : 'password'} autoComplete="new-password" placeholder={t.passwordPlaceholder} minLength={8} maxLength={128} required onBlur={handleAuthFieldBlur} aria-invalid={Boolean(authFieldErrors.confirmPassword)} aria-describedby={authFieldErrors.confirmPassword ? 'auth-confirm-password-error' : undefined} /><button type="button" className="password-visibility" onClick={() => setPasswordVisible(!passwordVisible)} aria-label={passwordVisible ? t.hidePassword : t.showPassword} title={passwordVisible ? t.hidePassword : t.showPassword}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.3-6 9.5-6 9.5 6 9.5 6-3.3 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.7"/>{passwordVisible && <path d="m4 4 16 16"/>}</svg></button></span>{authFieldErrors.confirmPassword && <small className="auth-field-error" id="auth-confirm-password-error">{authFieldErrors.confirmPassword}</small>}</label>}
              {error && <div className="message error-message auth-error" role="alert">{error}</div>}
              <button className="primary-button full-button auth-submit" disabled={busy}>{busy ? <><span className="auth-spinner" aria-hidden="true" />{t.loading}</> : <>{registering ? t.registerSubmit : t.loginSubmit}<span aria-hidden="true">{locale === 'ar' ? '←' : '→'}</span></>}</button>
            </form>
            <p className="auth-legal">{t.authPrivacy}</p>
          </div>
        </section>
      </div>}
    </main>
  );
}

function SearchIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.2"/><path d="m15.3 15.3 4.2 4.2"/></svg>;
}

function calendarDateFromKey(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
}

function calendarDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function calendarMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

function calendarMonthOffset(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1, 12);
}

function PremiumDropdown({ value, onChange, options, name, required = false, invalid = false }: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  name?: string;
  required?: boolean;
  invalid?: boolean;
}) {
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, maxHeight: 280 });
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const selectedLabel = options[selectedIndex]?.label ?? '';

  useEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const maxHeight = Math.max(120, Math.min(300, window.innerHeight - 32));
      const below = window.innerHeight - rect.bottom - 12;
      const top = below >= Math.min(maxHeight, 180) ? rect.bottom + 7 : Math.max(16, rect.top - maxHeight - 7);
      const width = Math.min(rect.width, window.innerWidth - 32);
      const left = Math.max(16, Math.min(rect.left, window.innerWidth - width - 16));
      setPosition({ top, left, width, maxHeight });
    };
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) setOpen(false);
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    document.addEventListener('pointerdown', closeOutside);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      document.removeEventListener('pointerdown', closeOutside);
    };
  }, [open]);

  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.focus();
  }, [open, activeIndex]);

  function closeAndRestoreFocus() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleTriggerKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex(selectedIndex);
      setOpen(true);
    }
    if (event.key === 'Escape' && open) { event.stopPropagation(); closeAndRestoreFocus(); }
  }

  function handleOptionKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(options.length - 1);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closeAndRestoreFocus();
    }
  }

  return <div className="premium-dropdown" ref={rootRef}>
    {name && <input type="hidden" name={name} value={value} />}
    <button ref={triggerRef} className="premium-dropdown-trigger" type="button" role="combobox" data-field-name={name} aria-required={required || undefined} aria-invalid={invalid || undefined} aria-haspopup="listbox" aria-controls={menuId} aria-expanded={open} onClick={() => { setActiveIndex(selectedIndex); setOpen((current) => !current); }} onKeyDown={handleTriggerKeyDown}>
      <span>{selectedLabel}</span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7.5 5 5 5-5" /></svg>
    </button>
    {open && typeof document !== 'undefined' && createPortal(<div id={menuId} ref={menuRef} className="premium-dropdown-menu" role="listbox" tabIndex={-1} style={{ top: position.top, left: position.left, width: position.width, maxHeight: position.maxHeight }}>
      {options.map((option, index) => <button ref={(node) => { optionRefs.current[index] = node; }} type="button" role="option" aria-selected={option.value === value} className={`premium-dropdown-option${option.value === value ? ' selected' : ''}`} key={option.value || 'all'} onKeyDown={(event) => handleOptionKeyDown(event, index)} onClick={() => { onChange(option.value); closeAndRestoreFocus(); }}>
        <span>{option.label}</span>{option.value === value && <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m4 10 4 4 8-8" /></svg>}
      </button>)}
    </div>, document.body)}
  </div>;
}

function DateRangePicker({ locale, label, checkInLabel, checkOutLabel, checkIn, checkOut, onChange, variant = 'search' }: {
  locale: Locale;
  label: string;
  checkInLabel: string;
  checkOutLabel: string;
  checkIn: string;
  checkOut: string;
  onChange: (checkIn: string, checkOut: string) => void;
  variant?: 'search' | 'booking';
}) {
  const [open, setOpen] = useState(false);
  const [selectingCheckOut, setSelectingCheckOut] = useState(false);
  const [month, setMonth] = useState(() => calendarMonthStart(calendarDateFromKey(checkIn) ?? new Date()));
  const [calendarPosition, setCalendarPosition] = useState({ top: 16, left: 16, centered: false });
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLElement>(null);
  const todayKey = calendarDateKey(new Date());
  const firstWeekday = locale === 'ar' ? 6 : 0;
  const monthFormatter = useMemo(() => new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' }), [locale]);
  const dayFormatter = useMemo(() => new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short' }), [locale]);
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short' }), [locale]);
  const fullDateFormatter = useMemo(() => new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', { dateStyle: 'full' }), [locale]);
  const dayNumberFormatter = useMemo(() => new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', { useGrouping: false }), [locale]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date(2024, 0, 7 + ((firstWeekday + index) % 7), 12);
    return dayFormatter.format(date);
  }), [dayFormatter, firstWeekday]);
  const months = useMemo(() => [month, calendarMonthOffset(month, 1)], [month]);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target) && !popoverRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsidePress);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePress);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(700, window.innerWidth - 32);
      const left = Math.max(16, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - 16));
      const maxHeight = Math.min(650, window.innerHeight * 0.72);
      const availableBelow = window.innerHeight - rect.bottom - 28;
      const availableAbove = rect.top - 28;
      const centered = availableBelow < maxHeight && availableAbove < Math.min(300, maxHeight);
      const top = centered ? 16 : availableBelow >= maxHeight ? rect.bottom + 12 : Math.max(16, rect.top - maxHeight - 12);
      setCalendarPosition({ top, left, centered });
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  function showCalendar() {
    setMonth(calendarMonthStart(calendarDateFromKey(checkIn) ?? new Date()));
    setSelectingCheckOut(false);
    setOpen(true);
  }

  function chooseDate(date: Date) {
    const key = calendarDateKey(date);
    if (!selectingCheckOut || !checkIn || key <= checkIn) {
      onChange(key, '');
      setSelectingCheckOut(true);
      if (date.getMonth() !== month.getMonth() || date.getFullYear() !== month.getFullYear()) setMonth(calendarMonthStart(date));
      return;
    }
    onChange(checkIn, key);
    setSelectingCheckOut(false);
    setOpen(false);
  }

  function renderMonth(displayMonth: Date) {
    const first = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), 1, 12);
    const offset = (first.getDay() - firstWeekday + 7) % 7;
    const gridStart = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), 1 - offset, 12);
    const days = Array.from({ length: 42 }, (_, index) => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index, 12));
    return <section className="calendar-month" key={`${displayMonth.getFullYear()}-${displayMonth.getMonth()}`} aria-label={monthFormatter.format(displayMonth)}>
      <h3>{monthFormatter.format(displayMonth)}</h3>
      <div className="calendar-weekdays">{weekDays.map((weekday, index) => <span key={`${weekday}-${index}`}>{weekday}</span>)}</div>
      <div className="calendar-days">{days.map((date) => {
        const key = calendarDateKey(date);
        const inMonth = date.getMonth() === displayMonth.getMonth();
        const startSelected = key === checkIn;
        const endSelected = key === checkOut;
        const inRange = Boolean(checkIn && checkOut && key > checkIn && key < checkOut);
        const disabled = key < todayKey || (selectingCheckOut && Boolean(checkIn) && key <= checkIn);
        const classes = ['calendar-day', !inMonth && 'outside-month', inRange && 'in-range', startSelected && 'range-start', endSelected && 'range-end'].filter(Boolean).join(' ');
        return <button type="button" key={key} className={classes} disabled={disabled} aria-label={fullDateFormatter.format(date)} aria-pressed={startSelected || endSelected} onClick={() => chooseDate(date)}>{dayNumberFormatter.format(date.getDate())}</button>;
      })}</div>
    </section>;
  }

  const checkInDate = calendarDateFromKey(checkIn);
  const checkOutDate = calendarDateFromKey(checkOut);
  const emptyDateLabel = locale === 'ar' ? 'اختر التاريخ' : 'Add dates';

  return <div className={`search-date-range calendar-range-field${variant === 'booking' ? ' calendar-range-field-booking' : ''}`} ref={rootRef}>
    <span>{label}</span>
    <button type="button" className="date-range-trigger" ref={triggerRef} aria-haspopup="dialog" aria-expanded={open} onClick={() => open ? setOpen(false) : showCalendar()}>
      <span className="date-range-value"><small>{checkInLabel}</small><b>{checkInDate ? dateFormatter.format(checkInDate) : emptyDateLabel}</b></span>
      <span className="date-range-divider" aria-hidden="true">—</span>
      <span className="date-range-value"><small>{checkOutLabel}</small><b>{checkOutDate ? dateFormatter.format(checkOutDate) : emptyDateLabel}</b></span>
      <CalendarIcon />
    </button>
    {open && typeof document !== 'undefined' && createPortal(<section ref={popoverRef} className={`calendar-popover${calendarPosition.centered ? ' calendar-popover--centered' : ''}`} style={{ top: calendarPosition.top, left: calendarPosition.left }} role="dialog" aria-modal="false" aria-label={locale === 'ar' ? 'اختيار تواريخ الإقامة' : 'Choose stay dates'} onKeyDown={(event) => { if (event.key === 'Escape') { setOpen(false); triggerRef.current?.focus(); } }}>
      <header className="calendar-popover-header">
        <div className="calendar-heading-copy"><span>{locale === 'ar' ? 'خطط لرحلتك' : 'Plan your stay'}</span><b>{selectingCheckOut ? checkOutLabel : locale === 'ar' ? 'اختر تاريخ الوصول' : 'Select check-in'}</b></div>
        <div className="calendar-nav"><button type="button" aria-label={locale === 'ar' ? 'الشهر السابق' : 'Previous month'} onClick={() => setMonth((current) => calendarMonthOffset(current, -1))}><CalendarChevron direction="previous" /></button><button type="button" aria-label={locale === 'ar' ? 'الشهر التالي' : 'Next month'} onClick={() => setMonth((current) => calendarMonthOffset(current, 1))}><CalendarChevron direction="next" /></button></div>
      </header>
      <div className="calendar-months">{months.map(renderMonth)}</div>
      <footer className="calendar-popover-footer"><button type="button" className="calendar-clear" onClick={() => { onChange('', ''); setSelectingCheckOut(false); }}>{locale === 'ar' ? 'مسح التواريخ' : 'Clear dates'}</button><button type="button" className="calendar-done" disabled={!checkIn || !checkOut} onClick={() => setOpen(false)}>{locale === 'ar' ? 'تم' : 'Done'}</button></footer>
    </section>, document.body)}
  </div>;
}

function CalendarIcon() {
  return <svg className="calendar-trigger-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="15" rx="2.5"/><path d="M7.5 3.5v4M16.5 3.5v4M3.5 10h17"/></svg>;
}

function CalendarChevron({ direction }: { direction: 'previous' | 'next' }) {
  return <svg className={`calendar-chevron ${direction}`} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>;
}

function DestinationPinIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M19 10.1c0 5-7 10.2-7 10.2S5 15.1 5 10.1a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.3"/></svg>;
}

function NavIcon({ kind }: { kind: 'trips' | 'host' }) {
  if (kind === 'trips') return <svg className="nav-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="5.5" width="16" height="15" rx="2.5"/><path d="M8 3.5v4M16 3.5v4M4 10h16M8 14h3m-3 3h6"/></svg>;
  return <svg className="nav-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3.5 10.5 12 3l8.5 7.5M5.5 9v11h13V9M9 20v-6h6v6"/></svg>;
}

function LogoutIcon() {
  return <svg className="logout-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M10 5H5.5A1.5 1.5 0 0 0 4 6.5v11A1.5 1.5 0 0 0 5.5 19H10M14 8l4 4-4 4m4-4H9"/></svg>;
}

function BrandMark() {
  return <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <path d="M7 40.5h34M11.5 40V22.5a12.5 12.5 0 0 1 25 0V40" />
    <path d="M18 40V28a6 6 0 0 1 12 0v12" />
    <path d="M22 40v-8a2 2 0 0 1 4 0v8" />
    <path d="m34 8 1.5-3 1.2 3 3.3 1.2-3.3 1.2-1.2 3-1.5-3-3-1.2 3-1.2Z" fill="currentColor" stroke="none" />
  </svg>;
}
