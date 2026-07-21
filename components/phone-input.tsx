"use client";

// Senegal first (primary audience), then a handful of common ones. WhatsApp
// OTP pricing is roughly flat across countries, so international numbers
// are supported (unlike the old SMS-only setup where cost pushed us to
// restrict to Senegal).
export const COUNTRY_CODES = [
  { code: "+221", flag: "🇸🇳", label: "Sénégal" },
  { code: "+223", flag: "🇲🇱", label: "Mali" },
  { code: "+224", flag: "🇬🇳", label: "Guinée" },
  { code: "+225", flag: "🇨🇮", label: "Côte d'Ivoire" },
  { code: "+220", flag: "🇬🇲", label: "Gambie" },
  { code: "+33", flag: "🇫🇷", label: "France" },
  { code: "+1", flag: "🇺🇸", label: "USA/Canada" },
  { code: "+44", flag: "🇬🇧", label: "UK" },
];

export const DEFAULT_COUNTRY_CODE = COUNTRY_CODES[0].code;

type PhoneInputProps = {
  countryCode: string;
  onCountryCodeChange: (v: string) => void;
  number: string;
  onNumberChange: (v: string) => void;
};

export const PhoneInput = ({
  countryCode,
  onCountryCodeChange,
  number,
  onNumberChange,
}: PhoneInputProps) => {
  return (
    <div className="flex w-full gap-2">
      <select
        value={countryCode}
        onChange={(e) => onCountryCodeChange(e.target.value)}
        className="rounded-2xl border-2 border-slate-200 bg-white px-2 text-base font-semibold outline-none focus:border-sky-300"
      >
        {COUNTRY_CODES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.code}
          </option>
        ))}
      </select>
      <input
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        value={number}
        onChange={(e) => onNumberChange(e.target.value.replace(/[^0-9]/g, ""))}
        placeholder="77 123 45 67"
        className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-lg outline-none focus:border-sky-300"
      />
    </div>
  );
};
