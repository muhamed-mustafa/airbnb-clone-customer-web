export type CustomerLocale = 'ar' | 'en';

type ArabicForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };

const intlLocale = (locale: CustomerLocale) => (locale === 'ar' ? 'ar-EG' : 'en-EG');

const arabicReferences: Record<string, string> = {
  alexandria: 'الإسكندرية', cairo: 'القاهرة', giza: 'الجيزة', 'north coast': 'الساحل الشمالي',
  'new cairo': 'القاهرة الجديدة', 'sharm el sheikh': 'شرم الشيخ', 'sharm el-sheikh': 'شرم الشيخ',
  hurghada: 'الغردقة', sinai: 'سيناء', 'saint catherine': 'سانت كاترين', egypt: 'مصر',
  'saudi arabia': 'السعودية', 'united arab emirates': 'الإمارات العربية المتحدة', 'united states': 'الولايات المتحدة', 'united kingdom': 'المملكة المتحدة',
  london: 'لندن', 'new york': 'نيويورك',
  apartment: 'شقة', house: 'منزل', villa: 'فيلا', studio: 'استوديو', cabin: 'كوخ', hotel: 'فندق',
};

export function localizeReference(value: string, locale: CustomerLocale) {
  if (locale === 'en') return value;
  const normalized = value.trim().toLocaleLowerCase('en').replace(/\s+/g, ' ');
  return arabicReferences[normalized] ?? value;
}

export function formatNumber(value: number, locale: CustomerLocale) {
  return new Intl.NumberFormat(intlLocale(locale), { maximumFractionDigits: 0 }).format(value);
}

export function formatMoney(value: number, locale: CustomerLocale) {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string | Date, locale: CustomerLocale, options?: Intl.DateTimeFormatOptions) {
  const date = value instanceof Date ? value : new Date(`${value.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(intlLocale(locale), options ?? { day: 'numeric', month: 'short' }).format(date);
}

export function formatCount(value: number, locale: CustomerLocale, forms: ArabicForms) {
  const category = new Intl.PluralRules(intlLocale(locale)).select(value);
  const label = forms[category] ?? forms.other;
  return `${formatNumber(value, locale)} ${label}`;
}

export function displayUnitTitle(title: string, locale: CustomerLocale, location: string) {
  if (!/^\s*(demo|test)\b/i.test(title)) return title;
  const fallbackLocation = location || (locale === 'ar' ? 'الإسكندرية' : 'Alexandria');
  return locale === 'ar' ? `إقامة أنيقة في ${fallbackLocation}` : `A considered stay in ${fallbackLocation}`;
}

export function isPreviewUnit(title: string, description: string) {
  return /^\s*(demo|test)\b/i.test(title) || /\b(not a real bookable property|demo qa accommodation)\b/i.test(description);
}

export function displayUnitDescription(description: string, locale: CustomerLocale) {
  if (!/\b(not a real bookable property|demo qa accommodation)\b/i.test(description)) return description;
  return locale === 'ar'
    ? 'هذا عرض تجريبي للإقامة؛ الصور توضيحية ولا يمكن إرسال طلب حجز لهذا المكان.'
    : 'Preview listing. Photos are illustrative, and this stay cannot be booked.';
}

export function formatBedrooms(value: number, locale: CustomerLocale) {
  return formatCount(value, locale, locale === 'ar'
    ? { zero: 'غرف نوم', one: 'غرفة نوم', two: 'غرفتا نوم', few: 'غرف نوم', many: 'غرفة نوم', other: 'غرفة نوم' }
    : { one: 'bedroom', other: 'bedrooms' });
}

export function formatGuests(value: number, locale: CustomerLocale) {
  return formatCount(value, locale, locale === 'ar'
    ? { zero: 'ضيوف', one: 'ضيف', two: 'ضيفان', few: 'ضيوف', many: 'ضيفًا', other: 'ضيف' }
    : { one: 'guest', other: 'guests' });
}

export function formatStayCount(value: number, locale: CustomerLocale) {
  return formatCount(value, locale, locale === 'ar'
    ? { zero: 'إقامات', one: 'إقامة', two: 'إقامتان', few: 'إقامات', many: 'إقامة', other: 'إقامة' }
    : { one: 'stay', other: 'stays' });
}
