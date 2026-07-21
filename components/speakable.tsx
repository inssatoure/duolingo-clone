"use client";

import { Volume2 } from "lucide-react";

import { speakSmart } from "@/lib/audio-client";
import { readLocaleCookie, readTargetCookie } from "@/lib/use-locale";
import { cn } from "@/lib/utils";

type SpeakableProps = {
  text: string;
  className?: string;
  iconClassName?: string;
  label?: string;
};

/**
 * A small speaker button next to any on-screen text, so a child or a
 * low-literacy user can always hear it read aloud on tap — not just lesson
 * options. Reuses the same speakSmart() decision (native recording, browser
 * TTS, or on-demand Wolof generation) as the rest of the app.
 */
export const Speakable = ({ text, className, iconClassName, label }: SpeakableProps) => {
  const play = () => {
    const locale = readLocaleCookie() ?? "fr";
    const target = readTargetCookie();
    speakSmart(text, locale, target);
  };

  return (
    <button
      type="button"
      onClick={play}
      aria-label={label ?? `Écouter : ${text}`}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full p-1.5 text-sahel transition hover:bg-sahel/10 active:scale-95",
        className
      )}
    >
      <Volume2 className={cn("h-5 w-5", iconClassName)} />
    </button>
  );
};

/** Text + speaker button, for a label that should read itself aloud. */
export const SpeakableText = ({
  text,
  as: Tag = "span",
  className,
}: {
  text: string;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
}) => (
  <Tag className={cn("inline-flex items-center gap-2", className)}>
    {text}
    <Speakable text={text} />
  </Tag>
);
