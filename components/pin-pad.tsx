"use client";

type PinPadProps = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  autoSubmit?: (value: string) => void;
};

/**
 * Big touch-friendly numeric keypad, designed for children and users who
 * may not read well — no keyboard required, just tap the digits.
 */
export const PinPad = ({ value, onChange, length = 4, autoSubmit }: PinPadProps) => {
  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

  const press = (d: string) => {
    if (d === "") return;
    if (d === "⌫") {
      onChange(value.slice(0, -1));
      return;
    }
    if (value.length >= length) return;
    const next = value + d;
    onChange(next);
    if (next.length === length) autoSubmit?.(next);
  };

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="flex gap-3">
        {Array.from({ length }).map((_, i) => (
          <div
            key={i}
            className={`flex h-14 w-14 items-center justify-center rounded-2xl border-2 text-2xl font-extrabold ${
              i < value.length
                ? "border-sahel bg-sahel/10 text-sahel"
                : "border-slate-200 text-transparent"
            }`}
          >
            {i < value.length ? "●" : "0"}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {digits.map((d, i) => (
          <button
            key={i}
            type="button"
            onClick={() => press(d)}
            disabled={d === ""}
            className={`flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold transition ${
              d === ""
                ? "invisible"
                : "border-2 border-b-4 border-slate-200 bg-white text-neutral-700 hover:bg-slate-50 active:border-b-2"
            }`}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  );
};
