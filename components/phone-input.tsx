"use client";

// SMS/WhatsApp delivery is limited to Senegal for now (cost + target
// audience), so the country is fixed rather than offered as a choice —
// one less decision for a child or low-literacy user to make.
export const SENEGAL_COUNTRY_CODE = "+221";

type PhoneInputProps = {
  number: string;
  onNumberChange: (v: string) => void;
};

export const PhoneInput = ({ number, onNumberChange }: PhoneInputProps) => {
  return (
    <div className="flex w-full gap-2">
      <span className="flex items-center gap-1 rounded-2xl border-2 border-slate-200 bg-white px-3 text-base font-semibold text-neutral-700">
        🇸🇳 {SENEGAL_COUNTRY_CODE}
      </span>
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
