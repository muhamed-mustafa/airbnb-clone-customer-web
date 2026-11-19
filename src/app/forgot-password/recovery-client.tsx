'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { BrandMark } from '../../components/brand-mark';

type Locale = 'ar' | 'en';
type Step = 'request' | 'verify' | 'reset' | 'done';
const copy = {
  ar: {
    eyebrow: 'العودة تبدأ من هنا', title: 'استعد الوصول إلى حسابك', intro: 'خطوات بسيطة وآمنة للعودة إلى رحلاتك وأماكنك.',
    requestTitle: 'أدخل بريدك الإلكتروني', requestHint: 'لو عندك حساب، هنرسل لك رمزًا صالحًا لمدة ١٠ دقائق.',
    email: 'البريد الإلكتروني', send: 'إرسال الرمز', verifyTitle: 'تحقق من بريدك',
    verifyHint: 'أدخل الرمز المكوّن من ٦ أرقام الذي أرسلناه. تحقق من البريد غير المرغوب فيه أيضًا.',
    code: 'رمز التحقق', verify: 'تأكيد الرمز', resend: 'إعادة إرسال الرمز', wait: 'أعد الإرسال بعد',
    resetTitle: 'اختر كلمة مرور جديدة', resetHint: 'استخدم ٨ أحرف على الأقل حتى تحافظ على أمان حسابك.',
    password: 'كلمة المرور الجديدة', confirm: 'تأكيد كلمة المرور', show: 'إظهار', hide: 'إخفاء', save: 'تحديث كلمة المرور',
    doneTitle: 'تم تحديث كلمة المرور', doneHint: 'يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.',
    home: 'العودة إلى الرئيسية', back: 'تغيير البريد الإلكتروني', loading: 'جارٍ التنفيذ…', verifying: 'جارٍ التحقق…', autoHint: 'يبدأ التحقق تلقائيًا عند إدخال ٦ أرقام',
    invalidCode: 'الرمز غير صحيح أو انتهت صلاحيته. اطلب رمزًا جديدًا.', invalidSession: 'انتهت جلسة الاستعادة. اطلب رمزًا جديدًا.',
    unavailable: 'خدمة استعادة كلمة المرور غير متاحة الآن. حاول لاحقًا.', error: 'تعذر إتمام الطلب. حاول مجددًا.',
    mismatch: 'كلمتا المرور غير متطابقتين.', length: 'كلمة المرور يجب أن تكون من ٨ إلى ١٢٨ حرفًا.',
    asideTitle: 'مكانك ينتظرك', asideText: 'كل التفاصيل التي أحببتها محفوظة. استعد حسابك واكمل رحلتك من حيث توقفت.',
  },
  en: {
    eyebrow: 'Your way back', title: 'Recover your account', intro: 'A few secure steps back to your trips and stays.',
    requestTitle: 'Enter your email', requestHint: 'If you have an account, we will send a code valid for 10 minutes.',
    email: 'Email address', send: 'Send code', verifyTitle: 'Check your inbox',
    verifyHint: 'Enter the six-digit code we sent. Check your spam folder too.',
    code: 'Verification code', verify: 'Verify code', resend: 'Resend code', wait: 'Resend in',
    resetTitle: 'Choose a new password', resetHint: 'Use at least 8 characters to keep your account secure.',
    password: 'New password', confirm: 'Confirm password', show: 'Show', hide: 'Hide', save: 'Update password',
    doneTitle: 'Password updated', doneHint: 'You can now sign in with your new password.',
    home: 'Back to home', back: 'Change email', loading: 'Working…', verifying: 'Verifying…', autoHint: 'Verification starts automatically after six digits',
    invalidCode: 'The code is invalid or expired. Request a new one.', invalidSession: 'Your reset session expired. Request a new code.',
    unavailable: 'Password recovery is temporarily unavailable. Try again later.', error: 'Could not complete the request. Try again.',
    mismatch: 'The passwords do not match.', length: 'Password must be 8 to 128 characters.',
    asideTitle: 'Your place is waiting', asideText: 'The details you love are saved. Recover your account and pick up where you left off.',
  },
} as const;

async function post(action: string, body: object, locale: Locale): Promise<unknown> {
  const response = await fetch(`/api/password-reset/${action}`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'accept-language': locale }, body: JSON.stringify(body), cache: 'no-store',
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { errors?: { code?: string }[] };
    throw new Error(payload.errors?.[0]?.code ?? `HTTP_${response.status}`);
  }
  if (response.status === 204) return undefined;
  const payload = await response.json();
  return payload.data ?? payload;
}

export default function RecoveryClient({ initialLocale }: { initialLocale: Locale }) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(false);
  const [resendAt, setResendAt] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const verifyingCode = useRef(false);
  const codeInput = useRef<HTMLInputElement>(null);
  const t = copy[locale];

  useEffect(() => { document.documentElement.lang = locale; document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'; }, [locale]);
  useEffect(() => {
    if (!resendAt) return;
    const tick = () => setSeconds(Math.max(0, Math.ceil((resendAt - Date.now()) / 1000)));
    tick(); const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [resendAt]);

  function errorText(cause: unknown) {
    const code = cause instanceof Error ? cause.message : '';
    if (code === 'CUSTOMER_PASSWORD_RESET_CODE_INVALID') return t.invalidCode;
    if (code === 'CUSTOMER_PASSWORD_RESET_SESSION_INVALID') return t.invalidSession;
    if (code === 'CUSTOMER_PASSWORD_RESET_EMAIL_UNAVAILABLE' || code === 'HTTP_503') return t.unavailable;
    return t.error;
  }
  async function requestCode(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault(); setBusy(true); setError('');
    try { await post('request', { email: email.trim(), language: locale }, locale); setCode(''); setStep('verify'); setResendAt(Date.now() + 60_000); }
    catch (cause) { setError(errorText(cause)); }
    finally { setBusy(false); }
  }
  async function verifyCode(value: string) {
    if (value.length !== 6 || verifyingCode.current || busy) return;
    verifyingCode.current = true;
    setBusy(true); setError('');
    try { const result = await post('verify', { email: email.trim(), code: value }, locale) as { resetToken: string }; setToken(result.resetToken); setStep('reset'); }
    catch (cause) { setError(errorText(cause)); setCode(''); window.requestAnimationFrame(() => codeInput.current?.focus()); }
    finally { verifyingCode.current = false; setBusy(false); }
  }
  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const newPassword = String(data.get('newPassword') ?? ''); const confirm = String(data.get('confirm') ?? '');
    if (newPassword.length < 8 || newPassword.length > 128) { setError(t.length); return; }
    if (newPassword !== confirm) { setError(t.mismatch); return; }
    setBusy(true); setError('');
    try { await post('complete', { resetToken: token, newPassword }, locale); setToken(''); setStep('done'); }
    catch (cause) { setError(errorText(cause)); }
    finally { setBusy(false); }
  }
  function switchLocale() {
    const next = locale === 'ar' ? 'en' : 'ar'; setLocale(next);
    document.cookie = `sakan_locale=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }

  return <main className="site-shell recovery-shell" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
    <header className="topbar recovery-topbar">
      <Link className="brand" href="/" aria-label={t.home}><span className="brand-mark"><BrandMark /></span><span><b>{locale === 'ar' ? 'أُلفة' : 'ULFA'}</b><small>{locale === 'ar' ? 'لكل رحلة مكان' : 'A place for every journey'}</small></span></Link>
      <button className="language-button" type="button" onClick={switchLocale}>{locale === 'ar' ? 'EN' : 'عربي'}</button>
    </header>
    <div className="recovery-layout">
      <section className="recovery-panel" aria-labelledby="recovery-title">
        <Link href="/" className="profile-back">{locale === 'ar' ? '→' : '←'} {t.home}</Link>
        <span className="eyebrow dark">{t.eyebrow}</span><h1 id="recovery-title">{t.title}</h1><p className="recovery-intro">{t.intro}</p>
        <div className="recovery-progress" aria-label={locale === 'ar' ? 'خطوات الاستعادة' : 'Recovery steps'}><span className={step === 'request' ? 'current' : ''}>01</span><i /><span className={step === 'verify' ? 'current' : ''}>02</span><i /><span className={step === 'reset' || step === 'done' ? 'current' : ''}>03</span></div>
        {error && <div className="message error-message" role="alert">{error}</div>}
        {step === 'request' && <form className="recovery-form" onSubmit={(event) => void requestCode(event)}><h2>{t.requestTitle}</h2><p>{t.requestHint}</p><label className="field"><span>{t.email}</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="name@example.com" required /></label><button className="primary-button" disabled={busy}>{busy ? <><span className="auth-spinner" />{t.loading}</> : t.send}</button></form>}
        {step === 'verify' && <form className="recovery-form activation-form" onSubmit={(event) => { event.preventDefault(); void verifyCode(code); }}><h2>{t.verifyTitle}</h2><p>{t.verifyHint}</p><b className="recovery-email" dir="ltr">{email}</b><div className="field activation-code-field"><label htmlFor="recovery-code">{t.code}</label><div className={`activation-otp${busy ? ' is-loading' : ''}${error ? ' has-error' : ''}`} dir="ltr"><div className="activation-otp-cells" aria-hidden="true">{Array.from({ length: 6 }, (_, index) => <span key={index} className={`activation-otp-cell${code[index] ? ' is-filled' : ''}${index === code.length && code.length < 6 ? ' is-current' : ''}`}>{code[index] ?? ''}</span>)}</div><input ref={codeInput} id="recovery-code" className="activation-otp-input" type="text" name="one-time-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} value={code} disabled={busy} aria-invalid={Boolean(error)} aria-describedby="recovery-code-hint" onChange={(event) => { const value = event.target.value.replace(/\D/g, '').slice(0, 6); setCode(value); setError(''); if (value.length === 6) void verifyCode(value); }} required /></div><small id="recovery-code-hint" className="activation-code-hint">{t.autoHint}</small></div><button className="primary-button" disabled={busy || code.length !== 6}>{busy ? <><span className="auth-spinner" />{t.verifying}</> : t.verify}</button><div className="recovery-actions"><button type="button" onClick={() => void requestCode()} disabled={busy || seconds > 0}>{seconds > 0 ? `${t.wait} ${seconds}s` : t.resend}</button><button type="button" disabled={busy} onClick={() => { setStep('request'); setCode(''); setError(''); }}>{t.back}</button></div></form>}
        {step === 'reset' && <form className="recovery-form" onSubmit={(event) => void resetPassword(event)}><h2>{t.resetTitle}</h2><p>{t.resetHint}</p><label className="field"><span>{t.password}</span><input type={visible ? 'text' : 'password'} name="newPassword" autoComplete="new-password" minLength={8} maxLength={128} required /></label><label className="field"><span>{t.confirm}</span><input type={visible ? 'text' : 'password'} name="confirm" autoComplete="new-password" minLength={8} maxLength={128} required /></label><button type="button" className="profile-visibility" onClick={() => setVisible((value) => !value)}>{visible ? t.hide : t.show}</button><button className="primary-button" disabled={busy}>{busy ? <><span className="auth-spinner" />{t.loading}</> : t.save}</button></form>}
        {step === 'done' && <div className="recovery-form recovery-done" role="status"><span aria-hidden="true">✓</span><h2>{t.doneTitle}</h2><p>{t.doneHint}</p><Link className="primary-button" href="/">{t.home}</Link></div>}
      </section>
      <aside className="recovery-aside"><span className="recovery-aside-number">ULFA / 01</span><div><span className="eyebrow">{t.eyebrow}</span><h2>{t.asideTitle}</h2><p>{t.asideText}</p></div><div className="recovery-aside-line" /></aside>
    </div>
  </main>;
}
