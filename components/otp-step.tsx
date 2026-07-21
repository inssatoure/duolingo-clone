"use client";

import { useEffect, useState } from "react";

import { PinPad } from "@/components/pin-pad";

type OtpStepProps = {
  title: string;
  phoneNumber: string;
  code: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onResend: () => void | Promise<void>;
  onChangeNumber: () => void;
};

const RESEND_DELAY = 45; // seconds — anti-spam so we don't burn SMS credits

/**
 * Shared SMS-code step: big numeric keypad (children/low-literacy friendly),
 * a "resend" button gated by a countdown, and a "change number" escape hatch.
 * Used by both the sign-up flow and the forgotten-PIN recovery flow.
 */
export const OtpStep = ({
  title,
  phoneNumber,
  code,
  onChange,
  onSubmit,
  onResend,
  onChangeNumber,
}: OtpStepProps) => {
  const [secondsLeft, setSecondsLeft] = useState(RESEND_DELAY);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  const resend = async () => {
    if (secondsLeft > 0) return;
    await onResend();
    setSecondsLeft(RESEND_DELAY);
  };

  return (
    <>
      <h1 className="text-center text-2xl font-extrabold text-sahel">{title}</h1>
      <p className="text-center text-sm text-muted-foreground">
        Envoyé au {phoneNumber}
      </p>

      <PinPad value={code} onChange={onChange} length={6} autoSubmit={onSubmit} />

      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => void resend()}
          disabled={secondsLeft > 0}
          className="text-sm font-bold text-sahel disabled:text-muted-foreground"
        >
          {secondsLeft > 0
            ? `Renvoyer le code (${secondsLeft}s)`
            : "Renvoyer le code"}
        </button>
        <button
          type="button"
          onClick={onChangeNumber}
          className="text-sm text-muted-foreground underline"
        >
          Changer de numéro
        </button>
      </div>
    </>
  );
};
