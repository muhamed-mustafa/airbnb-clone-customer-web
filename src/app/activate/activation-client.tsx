'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { BrandMark } from '../../components/brand-mark';

type Locale = 'ar' | 'en';
const copy = {
  ar: {
    home: 'العودة إلى الرئيسية', eyebrow: 'خطوة أخيرة وتبدأ الرحلة', title: 'فعّل بريدك الإلكتروني',
    intro: 'لحماية حسابك، أدخل الرمز الذي أرسلناه إلى بريدك. الرمز صالح لمدة ١٠ دقائق.',
    email: 'البريد الإلكتروني', code: 'رمز التفعيل', activate: 'تفعيل الحساب', resend: 'إعادة إرسال الرمز',
    wait: 'أعد الإرسال بعد', change: 'تغيير البريد', loading: 'جارٍ التحقق…', autoHint: 'يبدأ التحقق تلقائيًا عند إدخال ٦ أرقام',
    invalid: 'رمز التفعيل غير صحيح أو انتهت صلاحيته. اطلب رمزًا جديدًا.', unavailable: 'خدمة التفعيل غير متاحة الآن. حاول لاحقًا.',
    error: 'تعذر إتمام الطلب. حاول مرة أخرى.', sent: 'إذا كان حسابك بانتظار التفعيل ومتاحًا لإعادة الإرسال، سيصلك رمز جديد.',
    done: 'أهلًا بك في أُلفة', doneHint: 'تم تفعيل حسابك بنجاح. يمكنك الآن استكشاف أماكنك المفضلة.', explore: 'اكتشف الإقامات',
    asideTitle: 'رحلتك تبدأ هنا', asideText: 'أُلفة مساحة لاكتشاف إقامة تشبهك، وتجربة تصل إليها بسهولة وثقة.',
  },
  en: {
    home: 'Back to home', eyebrow: 'One last step', title: 'Verify your email',
    intro: 'Enter the code we emailed you to protect your account. It is valid for 10 minutes.',
    email: 'Email address', code: 'Activation code', activate: 'Activate account', resend: 'Resend code',
    wait: 'Resend in', change: 'Change email', loading: 'Verifying…', autoHint: 'Verification starts automatically after six digits',
    invalid: 'The activation code is invalid or expired. Request a new one.', unavailable: 'Activation is temporarily unavailable. Try again later.',
    error: 'Could not complete the request. Try again.', sent: 'If your account is awaiting activation and eligible, a new code will arrive.',
    done: 'Welcome to ULFA', doneHint: 'Your account is active. You can now explore your favorite places.', explore: 'Explore stays',
    asideTitle: 'Your journey starts here', asideText: 'ULFA is your space to find a stay that feels like you, with ease and confidence.',
  },
} as const;

export default function ActivationClient({ initialLocale, initialEmail }: { initialLocale: Locale; initialEmail: string }) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [editingEmail, setEditingEmail] = useState(!initialEmail);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
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
  async function resend(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/activation/resend', { method: 'POST', headers: { 'content-type': 'application/json', 'accept-language': locale }, body: JSON.stringify({ email: email.trim(), language: locale }) });
      if (!response.ok) throw new Error(response.status === 503 ? 'UNAVAILABLE' : 'FAILED');
      setEditingEmail(false); setResendAt(Date.now() + 60_000); setNotice(t.sent);
    } catch (cause) { setError(cause instanceof Error && cause.message === 'UNAVAILABLE' ? t.unavailable : t.error); }
    finally { setBusy(false); }
  }
  async function verify(value: string) {
    if (value.length !== 6 || verifyingCode.current || busy) return;
    verifyingCode.current = true;
    setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/auth/activate', { method: 'POST', headers: { 'content-type': 'application/json', 'accept-language': locale }, body: JSON.stringify({ email: email.trim(), code: value }) });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { errors?: { code?: string }[] };
        const reason = payload.errors?.[0]?.code;
        throw new Error(reason === 'CUSTOMER_ACTIVATION_CODE_INVALID' ? 'INVALID' : response.status === 503 ? 'UNAVAILABLE' : 'FAILED');
      }
      setDone(true); setCode('');
    } catch (cause) {
      const reason = cause instanceof Error ? cause.message : '';
      setError(reason === 'INVALID' ? t.invalid : reason === 'UNAVAILABLE' ? t.unavailable : t.error);
      setCode('');
      window.requestAnimationFrame(() => codeInput.current?.focus());
    } finally { verifyingCode.current = false; setBusy(false); }
  }
  function switchLocale() {
    const next = locale === 'ar' ? 'en' : 'ar'; setLocale(next);
    document.cookie = `sakan_locale=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }

  return <main className="site-shell recovery-shell" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
    <header className="topbar recovery-topbar"><Link href="/" className="brand" aria-label={t.home}><span className="brand-mark"><BrandMark /></span><span><b>{locale === 'ar' ? 'أُلفة' : 'ULFA'}</b><small>{locale === 'ar' ? 'لكل رحلة مكان' : 'A place for every journey'}</small></span></Link><button type="button" className="language-button" onClick={switchLocale}>{locale === 'ar' ? 'EN' : 'عربي'}</button></header>
    <div className="recovery-layout"><section className="recovery-panel" aria-labelledby="activation-title">
      <Link href="/" className="profile-back">{locale === 'ar' ? '→' : '←'} {t.home}</Link>
      <span className="eyebrow dark">{t.eyebrow}</span><h1 id="activation-title">{t.title}</h1><p className="recovery-intro">{t.intro}</p>
      <div className="recovery-progress"><span>01</span><i /><span className="current">02</span><i /><span className={done ? 'current' : ''}>03</span></div>
      {error && <div className="message error-message" role="alert">{error}</div>}{notice && <div className="message success-message" role="status">{notice}</div>}
      {done ? <div className="recovery-form recovery-done" role="status"><span aria-hidden="true">✓</span><h2>{t.done}</h2><p>{t.doneHint}</p><Link className="primary-button" href="/">{t.explore}</Link></div> : editingEmail ? <form className="recovery-form" onSubmit={(event) => void resend(event)}><label className="field"><span>{t.email}</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="name@example.com" required /></label><button className="primary-button" disabled={busy}>{busy ? <><span className="auth-spinner" />{t.loading}</> : t.resend}</button></form> : <form className="recovery-form activation-form" onSubmit={(event) => { event.preventDefault(); void verify(code); }}>
        <b className="recovery-email" dir="ltr">{email}</b>
        <div className="field activation-code-field">
          <label htmlFor="activation-code">{t.code}</label>
          <div className={`activation-otp${busy ? ' is-loading' : ''}${error ? ' has-error' : ''}`} dir="ltr">
            <div className="activation-otp-cells" aria-hidden="true">{Array.from({ length: 6 }, (_, index) => <span key={index} className={`activation-otp-cell${code[index] ? ' is-filled' : ''}${index === code.length && code.length < 6 ? ' is-current' : ''}`}>{code[index] ?? ''}</span>)}</div>
            <input ref={codeInput} id="activation-code" className="activation-otp-input" type="text" name="one-time-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} value={code} disabled={busy} aria-invalid={Boolean(error)} aria-describedby="activation-code-hint" onChange={(event) => { const value = event.target.value.replace(/\D/g, '').slice(0, 6); setCode(value); setError(''); if (value.length === 6) void verify(value); }} required />
          </div>
          <small id="activation-code-hint" className="activation-code-hint">{t.autoHint}</small>
        </div>
        <button className="primary-button" disabled={busy || code.length !== 6}>{busy ? <><span className="auth-spinner" />{t.loading}</> : t.activate}</button>
        <div className="recovery-actions"><button type="button" disabled={busy || seconds > 0} onClick={() => void resend()}>{seconds > 0 ? `${t.wait} ${seconds}s` : t.resend}</button><button type="button" disabled={busy} onClick={() => { setEditingEmail(true); setCode(''); setError(''); }}>{t.change}</button></div>
      </form>}
    </section><aside className="recovery-aside"><span className="recovery-aside-number">ULFA / 02</span><div><span className="eyebrow">{t.eyebrow}</span><h2>{t.asideTitle}</h2><p>{t.asideText}</p></div><div className="recovery-aside-line" /></aside></div>
  </main>;
}
