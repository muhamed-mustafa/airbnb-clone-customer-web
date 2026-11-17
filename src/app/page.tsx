'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';

type Unit = {
  id: string; title: string; description: string; address: string; photos: string[];
  costPerDay: number; country: string; city: string; unitCategory: string;
  roomsCount: number; adultsCount: number; kidsCount: number; hasInternetService: boolean;
  hasKitchen: boolean; hasPrivateGarage: boolean; availability: boolean; isActive?: boolean; version: number;
};
type Booking = {
  id: string; unit?: string | { title?: string; photos?: string[] }; checkIn: string; checkOut: string;
  totalAmount: number; status: string; guest?: string; host?: string;
};
type Ref = { id: string; name: string };
type PageResult<T> = { data: T[]; total: number; page: number; limit: number };
type Estimate = { available: boolean; daysCount: number; pricePerDay: number; vat: number; bookingAmount: number; vatAmount: number; totalAmount: number };
type Locale = 'ar' | 'en';

const words = {
  ar: {
    brand: 'سَكَن', tagline: 'أماكن لها حكاية', explore: 'اكتشف الإقامات', trips: 'رحلاتي',
    host: 'كن مضيفًا', account: 'تسجيل الدخول', search: 'ابحث عن مكان', where: 'إلى أين؟',
    dates: 'التواريخ', guests: 'الضيوف', homes: 'إقامات مختارة', stays: 'إقامة',
    night: 'لليلة', all: 'كل الإقامات', noResults: 'لم نعثر على إقامة مطابقة',
    noResultsHint: 'جرّب تغيير الوجهة أو توسيع نطاق السعر.', details: 'التفاصيل',
    bedrooms: 'غرف نوم', guestsCapacity: 'ضيوف', amenities: 'ما يقدمه المكان',
    reserve: 'احجز الإقامة', checkIn: 'تسجيل الوصول', checkOut: 'تسجيل المغادرة',
    adults: 'بالغون', children: 'أطفال', notes: 'رسالة للمضيف (اختياري)',
    check: 'تحقق من السعر والتوفر', booking: 'إرسال طلب الحجز', available: 'متاح في هذه التواريخ',
    unavailable: 'غير متاح في هذه التواريخ', subtotal: 'الإقامة', tax: 'الضرائب', total: 'الإجمالي',
    login: 'تسجيل الدخول', register: 'إنشاء حساب', name: 'الاسم الكامل', email: 'البريد الإلكتروني',
    password: 'كلمة المرور', countryCode: 'مفتاح الدولة', phone: 'رقم الهاتف',
    continue: 'متابعة', signOut: 'تسجيل الخروج', loginRequired: 'سجّل الدخول لمتابعة الحجز.',
    loadError: 'تعذر تحميل البيانات. تحقق من اتصال الخادم ثم أعد المحاولة.',
    saved: 'تم إرسال طلب الحجز بنجاح.', listingSaved: 'تم نشر وحدتك بنجاح.',
    tripsTitle: 'رحلاتك القادمة والسابقة', myPlaces: 'أماكني', addPlace: 'أضف مكانًا',
    createListing: 'أضف وحدتك', title: 'اسم الإقامة', description: 'وصف المكان',
    address: 'العنوان', photoUrl: 'رابط صورة رئيسية', price: 'السعر لليلة',
    country: 'الدولة', city: 'المدينة', category: 'نوع الإقامة', rooms: 'عدد الغرف',
    internet: 'إنترنت', kitchen: 'مطبخ', garage: 'موقف خاص', publish: 'نشر الإقامة',
    close: 'إغلاق', filter: 'تصفية', maxPrice: 'أقصى سعر لليلة', loading: 'جارٍ التحميل…',
    statusPending: 'قيد الانتظار', statusConfirmed: 'مؤكد', statusRejected: 'مرفوض',
    statusCancelled: 'ملغي', statusCompleted: 'مكتمل',
    asGuest: 'كضيف', asHost: 'كمضيف', active: 'نشطة', paused: 'متوقفة',
    pauseListing: 'إيقاف العرض', activateListing: 'إعادة التفعيل', deleteListing: 'حذف الإقامة',
  },
  en: {
    brand: 'SAKAN', tagline: 'Places with a story', explore: 'Explore stays', trips: 'My trips',
    host: 'Become a host', account: 'Log in', search: 'Find a place', where: 'Where to?',
    dates: 'Dates', guests: 'Guests', homes: 'Handpicked stays', stays: 'stays',
    night: 'night', all: 'All stays', noResults: 'No stays match your search',
    noResultsHint: 'Try changing the destination or widening your price range.', details: 'Details',
    bedrooms: 'bedrooms', guestsCapacity: 'guests', amenities: 'What this place offers',
    reserve: 'Reserve your stay', checkIn: 'Check-in', checkOut: 'Check-out',
    adults: 'Adults', children: 'Children', notes: 'Message to host (optional)',
    check: 'Check price & availability', booking: 'Request to book', available: 'Available for these dates',
    unavailable: 'Unavailable for these dates', subtotal: 'Stay', tax: 'Taxes', total: 'Total',
    login: 'Log in', register: 'Create account', name: 'Full name', email: 'Email address',
    password: 'Password', countryCode: 'Dial code', phone: 'Phone number',
    continue: 'Continue', signOut: 'Log out', loginRequired: 'Log in to continue with your booking.',
    loadError: 'Could not load the listings. Check the API connection and try again.',
    saved: 'Your booking request was sent.', listingSaved: 'Your stay is now published.',
    tripsTitle: 'Your upcoming and past trips', myPlaces: 'My places', addPlace: 'Add a place',
    createListing: 'List your place', title: 'Listing title', description: 'Describe your place',
    address: 'Street address', photoUrl: 'Cover photo URL', price: 'Price per night',
    country: 'Country', city: 'City', category: 'Stay type', rooms: 'Bedrooms',
    internet: 'Wi-Fi', kitchen: 'Kitchen', garage: 'Private parking', publish: 'Publish listing',
    close: 'Close', filter: 'Filter', maxPrice: 'Max price per night', loading: 'Loading…',
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
      : Array.isArray(body?.message) ? body.message.join(' · ') : 'Request failed';
    throw new Error(message);
  }
  return body as T;
}

function pageData<T>(value: unknown): PageResult<T> {
  if (typeof value !== 'object' || value === null) return { data: [], total: 0, page: 1, limit: 0 };
  const outer = value as { data?: unknown; total?: number; page?: number; limit?: number };
  if (Array.isArray(outer.data)) return outer as PageResult<T>;
  if (typeof outer.data === 'object' && outer.data !== null && Array.isArray((outer.data as { data?: unknown }).data)) {
    return outer.data as PageResult<T>;
  }
  return { data: [], total: 0, page: 1, limit: 0 };
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

export default function HomePage() {
  const [locale, setLocale] = useState<Locale>('ar');
  const [view, setView] = useState<'explore' | 'trips' | 'host'>('explore');
  const [units, setUnits] = useState<Unit[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [myUnits, setMyUnits] = useState<Unit[]>([]);
  const [party, setParty] = useState<'guest' | 'host'>('guest');
  const [countries, setCountries] = useState<Ref[]>([]);
  const [cities, setCities] = useState<Ref[]>([]);
  const [categories, setCategories] = useState<Ref[]>([]);
  const [selected, setSelected] = useState<Unit | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [query, setQuery] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [checkIn, setCheckIn] = useState(nextDate(14));
  const [checkOut, setCheckOut] = useState(nextDate(16));
  const [adultsCount, setAdults] = useState(2);
  const [kidsCount, setKids] = useState(0);
  const t = words[locale];

  const loadUnits = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: '1', limit: '24' });
    if (query.trim().length >= 3) params.set('title', query.trim());
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (category) params.set('unitCategory', category);
    try {
      const result = pageData<Unit>(await api('units?' + params.toString()));
      setUnits(result.data ?? []);
    } catch { setError(t.loadError); }
    finally { setLoading(false); }
  }, [query, maxPrice, category, t.loadError]);

  const loadBookings = useCallback(async (which: 'guest' | 'host' = party) => {
    try {
      const result = pageData<Booking>(await api('bookings/me?party=' + which + '&page=1&limit=20'));
      setBookings(result.data ?? []);
    } catch (cause) { setError(cause instanceof Error ? cause.message : t.loadError); }
  }, [party, t.loadError]);

  const loadMyUnits = useCallback(async () => {
    setError('');
    try {
      const result = pageData<Unit>(await api('units/me?page=1&limit=50'));
      setMyUnits(result.data ?? []);
    } catch (cause) { setError(cause instanceof Error ? cause.message : t.loadError); }
  }, [t.loadError]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadUnits(), 0);
    void Promise.all([
      api('countries').then(arrayData<Ref>).then(setCountries).catch(() => undefined),
      api('cities').then(arrayData<Ref>).then(setCities).catch(() => undefined),
      api('unit-categories').then(arrayData<Ref>).then(setCategories).catch(() => undefined),
      api('auth/me').then(() => setSignedIn(true)).catch(() => setSignedIn(false)),
    ]);
    return () => window.clearTimeout(timer);
  }, [loadUnits]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale]);

  const locationName = useMemo(() => (unit: Unit) => {
    const city = cities.find((item) => item.id === unit.city)?.name;
    const country = countries.find((item) => item.id === unit.country)?.name;
    return [city, country].filter(Boolean).join(', ') || unit.address;
  }, [cities, countries]);

  function chooseLocale(value: Locale) {
    setLocale(value);
    localStorage.setItem('sakan-locale', value);
  }

  async function openUnit(unit: Unit) {
    setSelected(unit);
    setEstimate(null);
    setCheckIn(nextDate(14));
    setCheckOut(nextDate(16));
    setAdults(Math.min(2, unit.adultsCount));
    setKids(0);
  }

  async function checkPrice() {
    if (!selected) return;
    setBusy(true); setError(''); setEstimate(null);
    try {
      const params = new URLSearchParams({ unit: selected.id, checkIn, checkOut, adultsCount: String(adultsCount), kidsCount: String(kidsCount) });
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
        unit: selected.id, checkIn, checkOut, adultsCount, kidsCount,
        ...(typeof notes === 'string' && notes.trim() ? { notes: notes.trim() } : {}),
      }) });
      setNotice(t.saved); setSelected(null); setEstimate(null);
      if (view === 'trips') await loadBookings();
    } catch (cause) { setError(cause instanceof Error ? cause.message : t.loadError); }
    finally { setBusy(false); }
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const action = registering ? 'register' : 'login';
      const response = await fetch('/api/auth/' + action, {
        method: 'POST', headers: { 'content-type': 'application/json', 'accept-language': locale },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof body.message === 'string' ? body.message : t.loadError);
      setSignedIn(true); setAuthOpen(false); setNotice(t.continue);
    } catch (cause) { setError(cause instanceof Error ? cause.message : t.loadError); }
    finally { setBusy(false); }
  }

  async function submitListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!signedIn) { setAuthOpen(true); setError(t.loginRequired); return; }
    setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) ?? '');
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
      setNotice(t.listingSaved); event.currentTarget.reset(); await loadUnits(); setView('explore');
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

  const statusText = (status: string) => {
    const key = status.toLowerCase();
    if (key.includes('pending')) return t.statusPending;
    if (key.includes('confirm')) return t.statusConfirmed;
    if (key.includes('reject')) return t.statusRejected;
    if (key.includes('cancel')) return t.statusCancelled;
    if (key.includes('complet')) return t.statusCompleted;
    return status;
  };

  return (
    <main className="site-shell">
      <header className="topbar">
        <button className="brand" onClick={() => switchView('explore')} aria-label={t.explore}>
          <span className="brand-mark">s</span><span><b>{t.brand}</b><small>{t.tagline}</small></span>
        </button>
        <nav className="main-nav" aria-label="Main navigation">
          <button className={view === 'explore' ? 'nav-link active' : 'nav-link'} onClick={() => switchView('explore')}>{t.explore}</button>
          <button className={view === 'trips' ? 'nav-link active' : 'nav-link'} onClick={() => switchView('trips')}>{t.trips}</button>
          <button className={view === 'host' ? 'nav-link active' : 'nav-link'} onClick={() => switchView('host')}>{t.host}</button>
        </nav>
        <div className="top-actions">
          <button className="language-button" onClick={() => chooseLocale(locale === 'ar' ? 'en' : 'ar')}>{locale === 'ar' ? 'EN' : 'عربي'}</button>
          {signedIn ? <button className="account-button" onClick={logOut}>{t.signOut}<span className="avatar">M</span></button> :
            <button className="account-button" onClick={() => { setRegistering(false); setAuthOpen(true); }}>{t.account}<span className="avatar">↗</span></button>}
        </div>
      </header>

      {view === 'explore' && <>
        <section className="hero">
          <Image className="hero-image" src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=2200&q=85" alt="Sunlit, thoughtfully designed home" fill priority sizes="100vw" />
          <div className="hero-shade" />
          <div className="hero-content">
            <span className="eyebrow">{t.brand} <i /> JOURNEYS, MADE PERSONAL</span>
            <h1>{locale === 'ar' ? <>إقامتك القادمة<br />تبدأ من هنا.</> : <>Your next stay<br />starts here.</>}</h1>
            <p>{locale === 'ar' ? 'أماكن مختارة بعناية، وتفاصيل تجعل الرحلة أقرب إليك.' : 'Considered homes, thoughtful details, and room to feel at home.'}</p>
            <div className="hero-search">
              <label><span>{t.where}</span><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && void loadUnits()} placeholder={locale === 'ar' ? 'مدينة، حيّ، أو اسم مكان' : 'City, neighbourhood, or stay'} /></label>
              <label className="price-filter"><span>{t.maxPrice}</span><input inputMode="numeric" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="—" /></label>
              <label className="category-filter"><span>{t.category}</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">{t.all}</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <button className="search-submit" onClick={() => void loadUnits()} aria-label={t.search}><SearchIcon /></button>
            </div>
          </div>
          <span className="hero-caption">A PLACE TO COME BACK TO</span>
        </section>

        <section className="content-section">
          <div className="section-heading">
            <div><span className="eyebrow dark">CURATED FOR YOUR NEXT CHAPTER</span><h2>{t.homes}</h2><p>{units.length} {t.stays}</p></div>
            <button className="subtle-button" onClick={() => { setQuery(''); setMaxPrice(''); setCategory(''); void loadUnits(); }}>{t.all}<span>↗</span></button>
          </div>
          {error && <div className="message error-message" role="alert">{error}</div>}
          {notice && <div className="message success-message" role="status">{notice}<button onClick={() => setNotice('')} aria-label={t.close}>×</button></div>}
          {loading ? <div className="loading-grid">{[1, 2, 3, 4].map((item) => <div className="skeleton-card" key={item}><div /><span /><i /></div>)}</div> :
            units.length ? <div className="stay-grid">{units.map((unit, index) => <button className="stay-card" key={unit.id} onClick={() => void openUnit(unit)}>
              <div className="stay-photo">
                {unit.photos?.[0] ? <Image src={unit.photos[0]} alt={unit.title} fill sizes="(max-width: 700px) 90vw, (max-width: 1100px) 45vw, 30vw" /> :
                  <div className={'photo-placeholder tone-' + (index % 4)}><span>{t.brand}</span></div>}
                <span className="photo-label">{unit.availability ? (locale === 'ar' ? 'متاح للحجز' : 'Available') : ''}</span>
                <span className="heart" aria-hidden="true">♡</span>
              </div>
              <span className="stay-meta"><b>{locationName(unit)}</b><span>✦ 4.9</span></span>
              <span className="stay-description">{unit.title}</span>
              <span className="stay-capacity">{unit.roomsCount} {t.bedrooms} · {unit.adultsCount} {t.guestsCapacity}</span>
              <span className="stay-price"><b>{new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US').format(unit.costPerDay)} <small>{locale === 'ar' ? 'ج.م' : 'EGP'}</small></b> / {t.night}</span>
            </button>)}</div> : <div className="empty-state"><span className="empty-mark">⌂</span><h3>{t.noResults}</h3><p>{t.noResultsHint}</p><button className="outline-button" onClick={() => { setQuery(''); setMaxPrice(''); void loadUnits(); }}>{t.all}</button></div>}
        </section>
        <footer className="site-footer"><span>© {new Date().getFullYear()} {t.brand}</span><span>{locale === 'ar' ? 'إقامات مختارة لتجارب تبقى.' : 'Considered stays for lasting memories.'}</span><button onClick={() => chooseLocale(locale === 'ar' ? 'en' : 'ar')}>{locale === 'ar' ? 'English' : 'العربية'}</button></footer>
      </>}

      {view === 'trips' && <section className="workspace-section"><div className="workspace-heading"><div><span className="eyebrow dark">YOUR TRAVEL JOURNAL</span><h1>{t.tripsTitle}</h1></div><button className="outline-button" onClick={() => switchView('explore')}>{t.explore} ↗</button></div>
        <div className="switch-tabs"><button className={party === 'guest' ? 'selected' : ''} onClick={() => { setParty('guest'); setBookings([]); void loadBookings('guest'); }}>{t.asGuest}</button><button className={party === 'host' ? 'selected' : ''} onClick={() => { setParty('host'); setBookings([]); void loadBookings('host'); }}>{t.asHost}</button></div>
        {error && <div className="message error-message" role="alert">{error}</div>}
        {bookings.length ? <div className="booking-list">{bookings.map((booking) => {
          const title = typeof booking.unit === 'object' ? booking.unit?.title : undefined;
          const image = typeof booking.unit === 'object' ? booking.unit?.photos?.[0] : undefined;
          return <article className="booking-card" key={booking.id}><div className="booking-thumb">{image && <Image src={image} alt={title ?? t.stays} fill sizes="180px" />}</div><div className="booking-info"><span className="status-pill">{statusText(booking.status)}</span><h3>{title ?? t.stays}</h3><p>{booking.checkIn?.slice(0, 10)} — {booking.checkOut?.slice(0, 10)}</p><b>{booking.totalAmount} {locale === 'ar' ? 'ج.م' : 'EGP'}</b></div></article>;
        })}</div> : <div className="empty-state"><span className="empty-mark">✳</span><h3>{locale === 'ar' ? 'رحلتك التالية تنتظرك' : 'Your next journey is waiting'}</h3><p>{locale === 'ar' ? 'ابدأ باكتشاف مكان يناسب خططك.' : 'Find a place that fits the way you want to travel.'}</p><button className="primary-button" onClick={() => switchView('explore')}>{t.explore}</button></div>}
      </section>}

      {view === 'host' && <section className="workspace-section"><div className="workspace-heading"><div><span className="eyebrow dark">MAKE ROOM FOR SOMETHING NEW</span><h1>{t.myPlaces}</h1><p>{locale === 'ar' ? 'شارك مكانًا تحبه مع ضيوف يبحثون عن تجربة مختلفة.' : 'Share a place you love with guests looking for something different.'}</p></div><button className="primary-button" onClick={() => { if (!signedIn) { setAuthOpen(true); setError(t.loginRequired); } else document.getElementById('listing-form')?.scrollIntoView({ behavior: 'smooth' }); }}>＋ {t.addPlace}</button></div>
        {error && <div className="message error-message" role="alert">{error}</div>}
        {myUnits.length > 0 && <div className="host-list">{myUnits.map((unit) => <article className="host-unit" key={unit.id}>
          <div className="host-thumb">{unit.photos?.[0] && <Image src={unit.photos[0]} alt={unit.title} fill sizes="140px" />}</div>
          <div className="host-unit-copy"><span className={unit.isActive ? 'host-state active-state' : 'host-state'}>{unit.isActive ? t.active : t.paused}</span><h3>{unit.title}</h3><p>{locationName(unit)} · {unit.costPerDay} {locale === 'ar' ? 'ج.م/ليلة' : 'EGP/night'}</p></div>
          <div className="host-unit-actions"><button className="outline-button" disabled={busy} onClick={() => void setListingActive(unit)}>{unit.isActive ? t.pauseListing : t.activateListing}</button><button className="danger-button" disabled={busy} onClick={() => void deleteListing(unit)}>{t.deleteListing}</button></div>
        </article>)}</div>}
        <form id="listing-form" className="listing-form" onSubmit={submitListing}><div className="form-title"><span className="eyebrow dark">A GOOD PLACE STARTS WITH A GOOD STORY</span><h2>{t.createListing}</h2></div>
          <div className="form-grid"><label className="field wide"><span>{t.title}</span><input name="title" minLength={5} maxLength={100} required /></label><label className="field wide"><span>{t.description}</span><textarea name="description" rows={3} required /></label><label className="field wide"><span>{t.address}</span><input name="address" required /></label><label className="field wide"><span>{t.photoUrl}</span><input name="photoUrl" type="url" required placeholder="https://…" /></label>
            <label className="field"><span>{t.country}</span><select name="country" required defaultValue=""><option value="" disabled>—</option>{countries.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label className="field"><span>{t.city}</span><select name="city" required defaultValue=""><option value="" disabled>—</option>{cities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label className="field"><span>{t.category}</span><select name="unitCategory" required defaultValue=""><option value="" disabled>—</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label className="field"><span>{t.price}</span><input name="costPerDay" type="number" min="1" required /></label>
            <label className="field"><span>{t.rooms}</span><input name="roomsCount" type="number" min="1" defaultValue="1" required /></label>
            <label className="field"><span>{t.adults}</span><input name="adultsCount" type="number" min="1" defaultValue="2" required /></label>
            <label className="field"><span>{t.children}</span><input name="kidsCount" type="number" min="0" defaultValue="0" required /></label></div>
          <div className="amenity-checks"><label><input type="checkbox" name="hasInternetService" /> {t.internet}</label><label><input type="checkbox" name="hasKitchen" /> {t.kitchen}</label><label><input type="checkbox" name="hasPrivateGarage" /> {t.garage}</label></div>
          {error && <div className="message error-message" role="alert">{error}</div>}<button className="primary-button" disabled={busy}>{busy ? t.loading : t.publish}</button>
        </form>
      </section>}

      {selected && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}>
        <section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="stay-title"><button className="modal-close" onClick={() => setSelected(null)} aria-label={t.close}>×</button>
          <div className="detail-image">{selected.photos?.[0] && <Image src={selected.photos[0]} alt={selected.title} fill sizes="(max-width: 800px) 100vw, 50vw" priority />}</div>
          <div className="detail-body"><span className="eyebrow dark">{locationName(selected)}</span><h2 id="stay-title">{selected.title}</h2><p className="detail-capacity">{selected.roomsCount} {t.bedrooms} · {selected.adultsCount} {t.guestsCapacity} · {selected.address}</p><p className="detail-description">{selected.description}</p>
            <div className="amenity-row"><span>{selected.hasInternetService ? '◉ ' + t.internet : ''}</span><span>{selected.hasKitchen ? '⌂ ' + t.kitchen : ''}</span><span>{selected.hasPrivateGarage ? '▣ ' + t.garage : ''}</span></div>
            <form className="booking-panel" onSubmit={requestBooking}><h3>{t.reserve}</h3><div className="date-grid"><label className="field"><span>{t.checkIn}</span><input type="date" value={checkIn} min={nextDate(1)} onChange={(event) => { setCheckIn(event.target.value); setEstimate(null); }} required /></label><label className="field"><span>{t.checkOut}</span><input type="date" value={checkOut} min={checkIn} onChange={(event) => { setCheckOut(event.target.value); setEstimate(null); }} required /></label></div>
              <div className="date-grid"><label className="field"><span>{t.adults}</span><input type="number" min="1" max={selected.adultsCount} value={adultsCount} onChange={(event) => setAdults(Number(event.target.value))} /></label><label className="field"><span>{t.children}</span><input type="number" min="0" max={selected.kidsCount} value={kidsCount} onChange={(event) => setKids(Number(event.target.value))} /></label></div>
              <button type="button" className="outline-button full-button" disabled={busy} onClick={() => void checkPrice()}>{busy ? t.loading : t.check}</button>
              {estimate && <div className="estimate"><p className={estimate.available ? 'available' : 'unavailable'}>{estimate.available ? '✓ ' + t.available : '× ' + t.unavailable}</p><div><span>{t.subtotal}</span><span>{estimate.bookingAmount} {locale === 'ar' ? 'ج.م' : 'EGP'}</span></div><div><span>{t.tax} ({estimate.vat}%)</span><span>{estimate.vatAmount} {locale === 'ar' ? 'ج.م' : 'EGP'}</span></div><div className="estimate-total"><b>{t.total}</b><b>{estimate.totalAmount} {locale === 'ar' ? 'ج.م' : 'EGP'}</b></div></div>}
              <label className="field notes-field"><span>{t.notes}</span><textarea name="notes" rows={2} maxLength={1000} /></label>
              {error && <div className="message error-message" role="alert">{error}</div>}
              <button className="primary-button full-button" disabled={busy || !estimate?.available}>{busy ? t.loading : t.booking}</button>
            </form>
          </div>
        </section>
      </div>}

      {authOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setAuthOpen(false)}>
        <section className="auth-modal" role="dialog" aria-modal="true"><button className="modal-close" onClick={() => setAuthOpen(false)} aria-label={t.close}>×</button><span className="eyebrow dark">{t.brand} · YOUR NEXT CHAPTER</span><h2>{registering ? t.register : t.login}</h2><p>{locale === 'ar' ? 'احجز مكانك أو شارك مكانًا تحبه.' : 'Book your stay or share a place you love.'}</p>
          <form onSubmit={submitAuth} className="auth-form">{registering && <><label className="field"><span>{t.name}</span><input name="name" minLength={2} maxLength={50} required /></label><div className="date-grid"><label className="field"><span>{t.countryCode}</span><input name="countryCode" defaultValue="+20" required /></label><label className="field"><span>{t.phone}</span><input name="phone" inputMode="tel" required /></label></div></>}
            <label className="field"><span>{t.email}</span><input name="email" type="email" autoComplete="email" required /></label><label className="field"><span>{t.password}</span><input name="password" type="password" autoComplete={registering ? 'new-password' : 'current-password'} minLength={registering ? 8 : 1} maxLength={128} required /></label>
            {error && <div className="message error-message" role="alert">{error}</div>}<button className="primary-button full-button" disabled={busy}>{busy ? t.loading : t.continue}</button>
          </form><button className="text-button" onClick={() => { setRegistering(!registering); setError(''); }}>{registering ? t.login : t.register}</button>
        </section>
      </div>}
    </main>
  );
}

function SearchIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.2"/><path d="m15.3 15.3 4.2 4.2"/></svg>;
}
