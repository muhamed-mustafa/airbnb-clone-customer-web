'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { BrandMark } from '../../components/brand-mark';

type Locale = 'ar' | 'en';
type Profile = { id: string; name: string; email: string; phone: string; emailVerified: boolean };
const copy = {
  ar: {
    home: 'اكتشف الإقامات', tagline: 'مكان تحسّه مكانك', profile: 'حسابي', eyebrow: 'مساحتك في أُلفة',
    intro: 'بياناتك وإعدادات الأمان في مكان واحد.', details: 'البيانات الشخصية', name: 'الاسم الكامل',
    email: 'البريد الإلكتروني', phone: 'رقم الهاتف', contactHint: 'بيانات التواصل مرتبطة بحسابك الحالي.', verified: 'البريد الإلكتروني مفعّل', pending: 'البريد الإلكتروني بانتظار التفعيل',
    save: 'حفظ التغييرات', saved: 'تم تحديث اسمك بنجاح.', security: 'الأمان وكلمة المرور',
    securityHint: 'بعد تغيير كلمة المرور، ستحتاج إلى تسجيل الدخول من جديد.',
    currentPassword: 'كلمة المرور الحالية', newPassword: 'كلمة المرور الجديدة', confirmPassword: 'تأكيد كلمة المرور',
    changePassword: 'تغيير كلمة المرور', passwordMismatch: 'كلمتا المرور الجديدتان غير متطابقتين.',
    passwordLength: 'استخدم من 8 إلى 128 حرفًا.', passwordChanged: 'تم تغيير كلمة المرور وإغلاق الجلسة. سجّل الدخول مجددًا.',
    signOut: 'تسجيل الخروج', loading: 'جارٍ التحميل…', saving: 'جارٍ الحفظ…', error: 'تعذر إتمام الطلب. حاول مجددًا.',
    sessionExpired: 'انتهت الجلسة. ارجع إلى الرئيسية لتسجيل الدخول.', back: 'العودة إلى الرئيسية', retry: 'إعادة المحاولة', show: 'إظهار كلمات المرور', hide: 'إخفاء كلمات المرور',
  },
  en: {
    home: 'Explore stays', tagline: 'A place that feels like yours', profile: 'My account', eyebrow: 'Your space at ULFA',
    intro: 'Your details and account security in one place.', details: 'Personal details', name: 'Full name',
    email: 'Email address', phone: 'Phone number', contactHint: 'Contact details are linked to your current account.', verified: 'Email verified', pending: 'Email awaiting verification',
    save: 'Save changes', saved: 'Your name has been updated.', security: 'Security and password',
    securityHint: 'After changing your password, you will need to sign in again.',
    currentPassword: 'Current password', newPassword: 'New password', confirmPassword: 'Confirm password',
    changePassword: 'Change password', passwordMismatch: 'The new passwords do not match.',
    passwordLength: 'Use 8 to 128 characters.', passwordChanged: 'Password changed and session closed. Sign in again.',
    signOut: 'Log out', loading: 'Loading…', saving: 'Saving…', error: 'Could not complete the request. Try again.',
    sessionExpired: 'Your session has expired. Return home to sign in.', back: 'Back to home', retry: 'Try again', show: 'Show passwords', hide: 'Hide passwords',
  },
} as const;

async function customerApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch('/api/backend/' + path, {
    ...options,
    headers: { 'content-type': 'application/json', 'accept-language': document.documentElement.lang, ...options.headers },
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(response.status === 401 ? 'SESSION_EXPIRED' : (typeof payload.message === 'string' ? payload.message : 'REQUEST_FAILED'));
  return (payload.data ?? payload) as T;
}

export default function ProfileClient({ initialLocale }: { initialLocale: Locale }) {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const t = copy[locale];
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<'name' | 'password' | 'logout' | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [signedOut, setSignedOut] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale]);
  useEffect(() => {
    let active = true;
    customerApi<Profile>('users/me').then((result) => {
      if (active) { setProfile(result); setName(result.name); }
    }).catch((cause: Error) => {
      if (active) { setError(cause.message === 'SESSION_EXPIRED' ? copy[initialLocale].sessionExpired : copy[initialLocale].error); if (cause.message === 'SESSION_EXPIRED') setSignedOut(true); }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [initialLocale]);

  function switchLocale() {
    const next = locale === 'ar' ? 'en' : 'ar';
    setLocale(next);
    document.cookie = 'sakan_locale=' + next + '; Path=/; Max-Age=31536000; SameSite=Lax';
  }
  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = name.trim();
    if (value.length < 2 || value.length > 50) { setError(locale === 'ar' ? 'الاسم يجب أن يكون من حرفين إلى 50 حرفًا.' : 'Name must be 2 to 50 characters.'); return; }
    setSaving('name'); setError(''); setMessage('');
    try {
      const updated = await customerApi<Profile>('users/me', { method: 'PATCH', body: JSON.stringify({ name: value }) });
      setProfile(updated); setName(updated.name); setMessage(t.saved);
    } catch (cause) { setError(cause instanceof Error && cause.message === 'SESSION_EXPIRED' ? t.sessionExpired : t.error); }
    finally { setSaving(null); }
  }
  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const currentPassword = String(data.get('currentPassword') ?? '');
    const newPassword = String(data.get('newPassword') ?? '');
    const confirmPassword = String(data.get('confirmPassword') ?? '');
    if (newPassword.length < 8 || newPassword.length > 128) { setError(t.passwordLength); return; }
    if (newPassword !== confirmPassword) { setError(t.passwordMismatch); return; }
    setSaving('password'); setError(''); setMessage('');
    try {
      await customerApi('auth/me/password', { method: 'PATCH', body: JSON.stringify({ currentPassword, newPassword }) });
      await fetch('/api/auth/logout', { method: 'POST' });
      form.reset(); setSignedOut(true); setMessage(t.passwordChanged);
    } catch { setError(t.error); }
    finally { setSaving(null); }
  }
  async function logout() {
    setSaving('logout'); setError('');
    try {
      await customerApi('auth/logout', { method: 'POST' });
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error('LOGOUT_FAILED');
      router.replace('/');
      router.refresh();
    } catch { setError(t.error); setSaving(null); }
  }
  const initial = profile?.name ? Array.from(profile.name.trim())[0] : '•';

  return <main className="site-shell profile-shell" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
    <header className="topbar profile-topbar">
      <Link href="/" className="brand" aria-label={t.home}><span className="brand-mark"><BrandMark /></span><span><b>{locale === 'ar' ? 'أُلفة' : 'ULFA'}</b><small>{t.tagline}</small></span></Link>
      <div className="top-actions"><button type="button" className="language-button" onClick={switchLocale}>{locale === 'ar' ? 'EN' : 'عربي'}</button>{!signedOut && <button type="button" className="account-button" disabled={saving !== null} onClick={() => void logout()}>{saving === 'logout' ? t.loading : t.signOut}</button>}</div>
    </header>
    <div className="profile-container">
      <Link href="/" className="profile-back">{locale === 'ar' ? '→' : '←'} {t.back}</Link>
      <div className="profile-heading"><span className="eyebrow dark">{t.eyebrow}</span><h1>{t.profile}</h1><p>{t.intro}</p></div>
      {message && !signedOut && <div className="message success-message" role="status">{message}</div>}
      {error && <div className="message error-message" role="alert">{error}</div>}
      {signedOut ? <div className="profile-card profile-signed-out"><h2>{message || t.sessionExpired}</h2><Link className="primary-button" href="/">{t.back}</Link></div> : loading ? <div className="profile-loading" role="status"><span className="auth-spinner" />{t.loading}</div> : profile ? <div className="profile-grid">
        <aside className="profile-card profile-identity"><div className="profile-avatar" aria-hidden="true">{initial}</div><h2>{profile.name}</h2><p dir="ltr">{profile.email}</p><p className={`profile-account-status${profile.emailVerified ? '' : ' is-pending'}`}>{profile.emailVerified ? t.verified : t.pending}</p><div className="profile-identity-line" /><span>{t.contactHint}</span></aside>
        <div className="profile-forms">
          <section className="profile-card" aria-labelledby="profile-details-title"><div className="profile-card-head"><span className="profile-card-index">01</span><div><h2 id="profile-details-title">{t.details}</h2><p>{t.contactHint}</p></div></div>
            <form onSubmit={(event) => void saveName(event)} className="profile-form"><label className="field"><span>{t.name}</span><input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={50} autoComplete="name" /></label><div className="profile-contact-grid"><label className="field"><span>{t.email}</span><input value={profile.email} readOnly dir="ltr" /></label><label className="field"><span>{t.phone}</span><input value={profile.phone} readOnly dir="ltr" /></label></div><button className="primary-button" disabled={saving !== null || name.trim() === profile.name}>{saving === 'name' ? t.saving : t.save}</button></form>
          </section>
          <section className="profile-card" aria-labelledby="profile-security-title"><div className="profile-card-head"><span className="profile-card-index">02</span><div><h2 id="profile-security-title">{t.security}</h2><p>{t.securityHint}</p></div></div>
            <form onSubmit={(event) => void changePassword(event)} className="profile-form"><div className="profile-contact-grid"><label className="field"><span>{t.currentPassword}</span><input name="currentPassword" type={passwordVisible ? 'text' : 'password'} autoComplete="current-password" required /></label><label className="field"><span>{t.newPassword}</span><input name="newPassword" type={passwordVisible ? 'text' : 'password'} autoComplete="new-password" minLength={8} maxLength={128} required /></label></div><label className="field"><span>{t.confirmPassword}</span><input name="confirmPassword" type={passwordVisible ? 'text' : 'password'} autoComplete="new-password" minLength={8} maxLength={128} required /></label><button type="button" className="profile-visibility" onClick={() => setPasswordVisible((visible) => !visible)}>{passwordVisible ? t.hide : t.show}</button><button className="primary-button" disabled={saving !== null}>{saving === 'password' ? t.saving : t.changePassword}</button></form>
          </section>
        </div>
      </div> : <div className="profile-card"><p>{t.error}</p><button type="button" className="outline-button" onClick={() => window.location.reload()}>{t.retry}</button></div>}
    </div>
  </main>;
}
