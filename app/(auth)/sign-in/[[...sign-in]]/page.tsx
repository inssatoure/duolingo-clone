"use client";

import { useState } from "react";

import { useSignIn } from "@clerk/nextjs/legacy";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { OtpStep } from "@/components/otp-step";
import { DEFAULT_COUNTRY_CODE, PhoneInput } from "@/components/phone-input";
import { PinPad } from "@/components/pin-pad";
import { Button } from "@/components/ui/button";

type Step = "method" | "phone" | "pin" | "resetOtp" | "resetPin";

const SignInPage = () => {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();

  const [step, setStep] = useState<Step>("method");
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [number, setNumber] = useState("");
  const [pin, setPin] = useState("");
  const [code, setCode] = useState("");
  const [newPin, setNewPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const phoneNumber = `${countryCode}${number}`;

  // Redeems a one-time ticket minted by our backend (register / pin-login /
  // reset-pin) into an actual Clerk session — Clerk's password system is
  // never touched by this app.
  const redeemTicket = async (ticket: string) => {
    if (!isLoaded) return false;
    const result = await signIn.create({ strategy: "ticket", ticket });
    if (result.status === "complete" && result.createdSessionId) {
      await setActive({ session: result.createdSessionId });
      router.push("/learn");
      return true;
    }
    return false;
  };

  const continueWithGoogle = async () => {
    if (!isLoaded) return;
    setError(null);
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sign-in/sso-callback",
        redirectUrlComplete: "/learn",
      });
    } catch {
      setError("Impossible de continuer avec Google. Réessaie.");
    }
  };

  const signInWithPin = async (value: string) => {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/pin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, pin: value }),
      });
      const data = (await res.json()) as { ticket?: string };
      if (!res.ok || !data.ticket || !(await redeemTicket(data.ticket))) {
        setError("Numéro ou code incorrect.");
        setPin("");
      }
    } catch {
      setError("Numéro ou code incorrect.");
      setPin("");
    } finally {
      setPending(false);
    }
  };

  const sendOtp = async () => {
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber }),
    });
    if (!res.ok) throw new Error();
  };

  // Forgotten-PIN recovery: prove phone ownership by SMS, then set a new PIN.
  const startReset = async () => {
    setPending(true);
    setError(null);
    try {
      await sendOtp();
      setCode("");
      setNewPin("");
      setStep("resetOtp");
    } catch {
      setError("Impossible d'envoyer le code. Réessaie dans un instant.");
    } finally {
      setPending(false);
    }
  };

  const resendOtp = async () => {
    setError(null);
    try {
      await sendOtp();
    } catch {
      setError("Impossible de renvoyer le code. Réessaie dans un instant.");
    }
  };

  // The code is collected here but verified only by /api/auth/reset-pin (a
  // Twilio Verify code is single-use), so we just advance to the new-PIN step.
  const submitResetCode = () => {
    setError(null);
    setStep("resetPin");
  };

  const finishReset = async (finalPin: string) => {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/reset-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, code, newPin: finalPin }),
      });
      const data = (await res.json()) as { ok?: boolean; ticket?: string };
      if (!res.ok || !data.ok) {
        setError("Code incorrect ou expiré. Recommence.");
        setNewPin("");
        setStep("resetOtp");
        setCode("");
        return;
      }
      // PIN reset — sign in immediately with the new PIN.
      if (!data.ticket || !(await redeemTicket(data.ticket))) {
        setError("Nouveau code enregistré. Reconnecte-toi.");
        setStep("pin");
        setPin("");
      }
    } catch {
      setError("Impossible de réinitialiser le code. Réessaie.");
      setNewPin("");
    } finally {
      setPending(false);
    }
  };

  const goBack = () => {
    setError(null);
    if (step === "phone") setStep("method");
    else if (step === "pin") setStep("phone");
    else if (step === "resetOtp") setStep("pin");
    else if (step === "resetPin") {
      setNewPin("");
      setStep("resetOtp");
    }
  };

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6 px-4 py-10">
      {step !== "method" && (
        <button
          type="button"
          onClick={goBack}
          className="self-start text-sm font-bold text-muted-foreground"
          aria-label="Revenir en arrière"
        >
          ← Retour
        </button>
      )}

      <Image src="/mascot.png" alt="" height={72} width={72} />

      {step === "method" && (
        <>
          <h1 className="text-center text-2xl font-extrabold text-sahel">
            Connexion
          </h1>
          <div className="flex w-full flex-col gap-3">
            <Button size="lg" variant="secondary" onClick={() => setStep("phone")}>
              📱 Continuer avec mon numéro
            </Button>
            <Button size="lg" variant="primaryOutline" onClick={() => void continueWithGoogle()}>
              Continuer avec Google
            </Button>
          </div>
        </>
      )}

      {step === "phone" && (
        <>
          <h1 className="text-center text-2xl font-extrabold text-sahel">
            Ton numéro de téléphone
          </h1>
          <PhoneInput
            countryCode={countryCode}
            onCountryCodeChange={setCountryCode}
            number={number}
            onNumberChange={setNumber}
          />
          <Button
            size="lg"
            variant="secondary"
            className="w-full"
            disabled={number.length < 6}
            onClick={() => setStep("pin")}
          >
            Continuer
          </Button>
        </>
      )}

      {step === "pin" && (
        <>
          <h1 className="text-center text-2xl font-extrabold text-sahel">
            Ton code à 4 chiffres
          </h1>
          <p className="text-center text-sm text-muted-foreground">{phoneNumber}</p>
          <PinPad value={pin} onChange={setPin} length={4} autoSubmit={signInWithPin} />
          <button
            type="button"
            onClick={() => void startReset()}
            disabled={pending}
            className="text-sm font-bold text-sahel"
          >
            Code oublié ?
          </button>
        </>
      )}

      {step === "resetOtp" && (
        <OtpStep
          title="Entre le code reçu"
          phoneNumber={phoneNumber}
          code={code}
          onChange={setCode}
          onSubmit={submitResetCode}
          onResend={resendOtp}
          onChangeNumber={() => setStep("phone")}
        />
      )}

      {step === "resetPin" && (
        <>
          <h1 className="text-center text-2xl font-extrabold text-sahel">
            Choisis un nouveau code
          </h1>
          <p className="text-center text-sm text-muted-foreground">
            Un nouveau code à 4 chiffres
          </p>
          <PinPad value={newPin} onChange={setNewPin} length={4} autoSubmit={finishReset} />
        </>
      )}

      {error && <p className="text-center text-sm text-rose-500">{error}</p>}
      {pending && <p className="text-sm text-muted-foreground">Un instant…</p>}
    </div>
  );
};

export default SignInPage;
