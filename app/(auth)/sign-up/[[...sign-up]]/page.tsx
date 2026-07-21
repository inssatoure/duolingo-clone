"use client";

import { useState } from "react";

import { useSignIn, useSignUp } from "@clerk/nextjs/legacy";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { OtpStep } from "@/components/otp-step";
import { DEFAULT_COUNTRY_CODE, PhoneInput } from "@/components/phone-input";
import { PinPad } from "@/components/pin-pad";
import { Button } from "@/components/ui/button";

type Step = "method" | "phone" | "otp" | "profile";

const SignUpPage = () => {
  // Google keeps going through Clerk's own OAuth (useSignUp); the phone/PIN
  // path bypasses Clerk's password system entirely via our own backend, and
  // only uses useSignIn at the very end to redeem the one-time ticket it hands
  // back (see app/api/auth/register).
  const { isLoaded: signUpLoaded, signUp } = useSignUp();
  const { isLoaded: signInLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();

  const [step, setStep] = useState<Step>("method");
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [number, setNumber] = useState("");
  const [code, setCode] = useState("");
  const [verifiedToken, setVerifiedToken] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const phoneNumber = `${countryCode}${number}`;

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
      await sendOtp();
      setCode("");
      setStep("otp");
    } catch {
      setError("Impossible d'envoyer le code. Vérifie le numéro et réessaie.");
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
        setStep("profile");
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

  const finish = async (finalPin: string) => {
    if (!signInLoaded || !name.trim() || !verifiedToken) {
      setError("Entre ton prénom pour continuer.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, verifiedToken, name, pin: finalPin }),
      });
      const data = (await res.json()) as { ticket?: string };
      if (!res.ok || !data.ticket) {
        setError("Ce numéro est peut-être déjà utilisé. Réessaie.");
        setPin("");
        return;
      }

      const result = await signIn.create({ strategy: "ticket", ticket: data.ticket });
      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        router.push("/learn");
      } else {
        setError("Compte créé. Connecte-toi avec ton code.");
        router.push("/sign-in");
      }
    } catch {
      setError("Impossible de finaliser l'inscription. Réessaie.");
      setPin("");
    } finally {
      setPending(false);
    }
  };

  const goBack = () => {
    setError(null);
    if (step === "phone") setStep("method");
    else if (step === "otp") {
      setCode("");
      setStep("phone");
    } else if (step === "profile") setStep("phone");
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
            Crée ton compte
          </h1>
          <div className="flex w-full flex-col gap-3">
            <Button size="lg" variant="secondary" onClick={() => setStep("phone")}>
              📱 Continuer avec mon numéro
            </Button>
            <Button size="lg" variant="primaryOutline" onClick={() => void continueWithGoogle()}>
              Continuer avec Google
            </Button>
          </div>
          <div id="clerk-captcha" />
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
            disabled={pending || number.length < 6}
            onClick={() => void submitPhone()}
          >
            Continuer
          </Button>
        </>
      )}

      {step === "otp" && (
        <OtpStep
          title="Entre le code reçu"
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

      {step === "profile" && (
        <>
          <h1 className="text-center text-2xl font-extrabold text-sahel">
            Comment tu t&apos;appelles ?
          </h1>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ton prénom"
            className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-lg outline-none focus:border-sky-300"
          />
          <h2 className="text-center text-lg font-bold text-neutral-700">
            Choisis un code à 4 chiffres
          </h2>
          <p className="text-center text-sm text-muted-foreground">
            Tu t&apos;en serviras pour te reconnecter
          </p>
          <PinPad value={pin} onChange={setPin} length={4} autoSubmit={finish} />
        </>
      )}

      {error && <p className="text-center text-sm text-rose-500">{error}</p>}
      {pending && <p className="text-sm text-muted-foreground">Un instant…</p>}
    </div>
  );
};

export default SignUpPage;
