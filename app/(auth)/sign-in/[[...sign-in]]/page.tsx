"use client";

import { useState } from "react";

import { useSignIn } from "@clerk/nextjs/legacy";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { PhoneInput } from "@/components/phone-input";
import { PinPad } from "@/components/pin-pad";
import { Button } from "@/components/ui/button";

type Step = "method" | "phone" | "pin";

const SignInPage = () => {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();

  const [step, setStep] = useState<Step>("method");
  const [countryCode, setCountryCode] = useState("+221");
  const [number, setNumber] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const phoneNumber = `${countryCode}${number}`;

  const describeError = (e: unknown, fallback: string) =>
    isClerkAPIResponseError(e) ? (e.errors[0]?.longMessage ?? fallback) : fallback;

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

  const submitPin = async (value: string) => {
    if (!isLoaded) return;
    setPending(true);
    setError(null);
    try {
      const result = await signIn.create({ identifier: phoneNumber, password: value });
      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        router.push("/learn");
      } else {
        setError("Numéro ou code incorrect.");
        setPin("");
      }
    } catch (e) {
      setError(describeError(e, "Numéro ou code incorrect."));
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
          <PinPad value={pin} onChange={setPin} length={4} autoSubmit={submitPin} />
        </>
      )}

      {error && <p className="text-center text-sm text-rose-500">{error}</p>}
      {pending && <p className="text-sm text-muted-foreground">Un instant…</p>}
    </div>
  );
};

export default SignInPage;
