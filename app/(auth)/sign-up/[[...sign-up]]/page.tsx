"use client";

import { useState } from "react";

import { useSignUp } from "@clerk/nextjs/legacy";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { PhoneInput } from "@/components/phone-input";
import { PinPad } from "@/components/pin-pad";
import { Button } from "@/components/ui/button";

type Step = "method" | "phone" | "otp" | "profile";

const SignUpPage = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [step, setStep] = useState<Step>("method");
  const [countryCode, setCountryCode] = useState("+221");
  const [number, setNumber] = useState("");
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const phoneNumber = `${countryCode}${number}`;

  const describeError = (e: unknown, fallback: string) =>
    isClerkAPIResponseError(e) ? (e.errors[0]?.longMessage ?? fallback) : fallback;

  const continueWithGoogle = async () => {
    if (!isLoaded) return;
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

  const submitPhone = async () => {
    if (!isLoaded || number.length < 6) return;
    setPending(true);
    setError(null);
    try {
      await signUp.create({ phoneNumber });
      await signUp.preparePhoneNumberVerification({ strategy: "phone_code" });
      setStep("otp");
    } catch (e) {
      setError(
        describeError(e, "Ce numéro n'a pas pu être utilisé. Vérifie-le et réessaie.")
      );
    } finally {
      setPending(false);
    }
  };

  const submitCode = async (value: string) => {
    if (!isLoaded) return;
    setPending(true);
    setError(null);
    try {
      const result = await signUp.attemptPhoneNumberVerification({ code: value });
      if (result.status === "complete" || result.status === "missing_requirements") {
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
    if (!isLoaded || !name.trim()) {
      setError("Entre ton prénom pour continuer.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const result = await signUp.update({
        password: finalPin,
        firstName: name.trim(),
      });
      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        router.push("/learn");
      } else {
        setError("Impossible de finaliser l'inscription. Réessaie.");
      }
    } catch (e) {
      setError(describeError(e, "Impossible de finaliser l'inscription. Réessaie."));
      setPin("");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6 px-4 py-10">
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
        <>
          <h1 className="text-center text-2xl font-extrabold text-sahel">
            Entre le code reçu par SMS
          </h1>
          <p className="text-center text-sm text-muted-foreground">
            Envoyé au {phoneNumber}
          </p>
          <PinPad value={code} onChange={setCode} length={6} autoSubmit={submitCode} />
        </>
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
