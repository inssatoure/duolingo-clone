"use client";

import { useEffect, useState } from "react";

import { useSignIn, useSignUp } from "@clerk/nextjs/legacy";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { OtpStep } from "@/components/otp-step";
import { DEFAULT_COUNTRY_CODE, PhoneInput } from "@/components/phone-input";
import { PinPad } from "@/components/pin-pad";
import { Speakable } from "@/components/speakable";
import { Button } from "@/components/ui/button";
import { speakSmart } from "@/lib/audio-client";
import { readLocaleCookie, readTargetCookie } from "@/lib/use-locale";

type Step =
  | "method"
  | "phone"
  | "otp"
  | "newPin1"
  | "newPin2"
  | "newName"
  | "pin"
  | "resetOtp"
  | "resetPin";

// One page for both sign-up and sign-in: enter a phone number, and the
// server tells us whether that number already has an account, so we branch
// straight to "PIN once" (existing) or "PIN x2 + name" (new) — no separate
// routes/flows to choose between up front.
export const AuthFlow = () => {
  const { isLoaded: signUpLoaded, signUp } = useSignUp();
  const { isLoaded: signInLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();

  const [step, setStep] = useState<Step>("method");
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [number, setNumber] = useState("");
  const [code, setCode] = useState("");
  const [verifiedToken, setVerifiedToken] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [firstPin, setFirstPin] = useState("");
  const [name, setName] = useState("");
  const [newPin, setNewPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const phoneNumber = `${countryCode}${number}`;

  // Every screen title is read aloud as soon as it appears — not just on tap
  // — for learners who can't read at all.
  const titles: Record<Step, string> = {
    method: "Connexion ou inscription",
    phone: "Ton numéro de téléphone",
    otp: "Entre le code reçu",
    newPin1: "Choisis un code à 4 chiffres",
    newPin2: "Retape le même code",
    newName: "Comment veux-tu qu'on t'appelle ?",
    pin: "Ton code à 4 chiffres",
    resetOtp: "Entre le code reçu",
    resetPin: "Choisis un nouveau code",
  };
  useEffect(() => {
    const locale = readLocaleCookie() ?? "fr";
    const target = readTargetCookie();
    const t = setTimeout(() => speakSmart(titles[step], locale, target), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const redeemTicket = async (ticket: string) => {
    if (!signInLoaded) return false;
    const result = await signIn.create({ strategy: "ticket", ticket });
    if (result.status === "complete" && result.createdSessionId) {
      await setActive({ session: result.createdSessionId });
      router.push("/learn");
      return true;
    }
    return false;
  };

  const continueWithGoogle = async () => {
    if (!signUpLoaded) return;
    setError(null);
    try {
      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sign-up/sso-callback",
        redirectUrlComplete: "/learn",
      });
    } catch {
      setError("Impossible de continuer avec Google. Réessaie.");
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

  const submitPhone = async () => {
    if (number.length < 6) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/check-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });
      const data = (await res.json()) as { exists?: boolean };
      if (!res.ok) throw new Error();

      if (data.exists) {
        setPin("");
        setStep("pin");
      } else {
        await sendOtp();
        setCode("");
        setStep("otp");
      }
    } catch {
      setError("Une erreur est survenue. Vérifie le numéro et réessaie.");
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

  const submitCode = async (value: string) => {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, code: value }),
      });
      const data = (await res.json()) as { valid?: boolean; verifiedToken?: string };
      if (res.ok && data.valid && data.verifiedToken) {
        setVerifiedToken(data.verifiedToken);
        setFirstPin("");
        setStep("newPin1");
      } else {
        setError("Code incorrect. Réessaie.");
        setCode("");
      }
    } catch {
      setError("Code incorrect. Réessaie.");
      setCode("");
    } finally {
      setPending(false);
    }
  };

  const submitFirstPin = (value: string) => {
    setError(null);
    setFirstPin(value);
    setPin("");
    setStep("newPin2");
  };

  const submitSecondPin = (value: string) => {
    if (value !== firstPin) {
      setError("Les deux codes ne correspondent pas. Recommence.");
      setPin("");
      setFirstPin("");
      setStep("newPin1");
      return;
    }
    setError(null);
    setPin(value);
    setStep("newName");
  };

  const finishRegister = async () => {
    if (!name.trim() || !verifiedToken) {
      setError("Entre ton prénom pour continuer.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, verifiedToken, name, pin }),
      });
      const data = (await res.json()) as { ticket?: string };
      if (!res.ok || !data.ticket || !(await redeemTicket(data.ticket))) {
        setError("Ce numéro est peut-être déjà utilisé. Réessaie.");
        setStep("phone");
      }
    } catch {
      setError("Impossible de finaliser l'inscription. Réessaie.");
    } finally {
      setPending(false);
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
    else if (step === "otp") setStep("phone");
    else if (step === "newPin1") setStep("otp");
    else if (step === "newPin2") setStep("newPin1");
    else if (step === "newName") setStep("newPin2");
    else if (step === "pin") setStep("phone");
    else if (step === "resetOtp") setStep("pin");
    else if (step === "resetPin") setStep("resetOtp");
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
          <div className="flex items-center gap-2">
            <h1 className="text-center text-2xl font-extrabold text-sahel">
              {titles.method}
            </h1>
            <Speakable text={titles.method} />
          </div>
          <div className="flex w-full flex-col gap-3">
            <Button size="lg" variant="primaryOutline" onClick={() => void continueWithGoogle()}>
              Continuer avec Google
            </Button>
            <Button size="lg" variant="secondary" onClick={() => setStep("phone")}>
              📱 Continuer avec mon numéro
            </Button>
          </div>
          <div id="clerk-captcha" />
        </>
      )}

      {step === "phone" && (
        <>
          <div className="flex items-center gap-2">
            <h1 className="text-center text-2xl font-extrabold text-sahel">
              {titles.phone}
            </h1>
            <Speakable text={titles.phone} />
          </div>
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
            disabled={pending || number.length < 6}
            onClick={() => void submitPhone()}
          >
            Continuer
          </Button>
        </>
      )}

      {step === "otp" && (
        <OtpStep
          title={titles.otp}
          phoneNumber={phoneNumber}
          code={code}
          onChange={setCode}
          onSubmit={submitCode}
          onResend={resendOtp}
          onChangeNumber={() => {
            setCode("");
            setStep("phone");
          }}
        />
      )}

      {step === "newPin1" && (
        <>
          <div className="flex items-center gap-2">
            <h1 className="text-center text-2xl font-extrabold text-sahel">
              {titles.newPin1}
            </h1>
            <Speakable text={titles.newPin1} />
          </div>
          <PinPad value={pin} onChange={setPin} length={4} autoSubmit={submitFirstPin} />
        </>
      )}

      {step === "newPin2" && (
        <>
          <div className="flex items-center gap-2">
            <h1 className="text-center text-2xl font-extrabold text-sahel">
              {titles.newPin2}
            </h1>
            <Speakable text={titles.newPin2} />
          </div>
          <PinPad value={pin} onChange={setPin} length={4} autoSubmit={submitSecondPin} />
        </>
      )}

      {step === "newName" && (
        <>
          <div className="flex items-center gap-2">
            <h1 className="text-center text-2xl font-extrabold text-sahel">
              {titles.newName}
            </h1>
            <Speakable text={titles.newName} />
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ton prénom"
            className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-lg outline-none focus:border-sky-300"
          />
          <Button
            size="lg"
            variant="secondary"
            className="w-full"
            disabled={pending || !name.trim()}
            onClick={() => void finishRegister()}
          >
            Créer mon compte
          </Button>
        </>
      )}

      {step === "pin" && (
        <>
          <div className="flex items-center gap-2">
            <h1 className="text-center text-2xl font-extrabold text-sahel">
              {titles.pin}
            </h1>
            <Speakable text={titles.pin} />
          </div>
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
          title={titles.resetOtp}
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
          <div className="flex items-center gap-2">
            <h1 className="text-center text-2xl font-extrabold text-sahel">
              {titles.resetPin}
            </h1>
            <Speakable text={titles.resetPin} />
          </div>
          <PinPad value={newPin} onChange={setNewPin} length={4} autoSubmit={finishReset} />
        </>
      )}

      {error && <p className="text-center text-sm text-rose-500">{error}</p>}
      {pending && <p className="text-sm text-muted-foreground">Un instant…</p>}
    </div>
  );
};
