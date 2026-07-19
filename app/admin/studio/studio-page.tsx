"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Title } from "react-admin";

import dictionaryData from "@/seeds/dictionary.json";

type Entry = { wolof: string; fr: string; en: string; category: string };
type Lang = "wo" | "fr" | "en";

const LANGS: { lang: Lang; label: string; flag: string }[] = [
  { lang: "wo", label: "Wolof", flag: "🇸🇳" },
  { lang: "fr", label: "Français", flag: "🇫🇷" },
  { lang: "en", label: "English", flag: "🇬🇧" },
];

const keyOf = (text: string) => text.trim().toLowerCase().normalize("NFC");
const textFor = (e: Entry, lang: Lang) =>
  lang === "wo" ? e.wolof : lang === "fr" ? e.fr : e.en;

export const StudioPage = () => {
  const entries = dictionaryData as Entry[];

  const [recorded, setRecorded] = useState<Set<string>>(new Set());
  const [index, setIndex] = useState(0);
  const [recordingLang, setRecordingLang] = useState<Lang | null>(null);
  const [pendingBlob, setPendingBlob] = useState<{ lang: Lang; blob: Blob } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [langFilter, setLangFilter] = useState<Lang | null>("en");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const entry = entries[index];

  useEffect(() => {
    fetch("/api/recordings")
      .then((r) => r.json())
      .then((d: { recorded: { text_key: string; lang: string }[] }) =>
        setRecorded(new Set(d.recorded.map((r) => `${r.text_key}|${r.lang}`)))
      )
      .catch(() => setError("Impossible de charger le statut des enregistrements."));
  }, []);

  const isDone = (e: Entry, lang: Lang) =>
    recorded.has(`${keyOf(textFor(e, lang))}|${lang}`);

  const doneCount = useMemo(() => {
    let n = 0;
    for (const e of entries)
      for (const { lang } of LANGS) if (isDone(e, lang)) n++;
    return n;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, recorded]);

  const startRecording = async (lang: Lang) => {
    setError(null);
    setPendingBlob(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        setPendingBlob({ lang, blob });
        setRecordingLang(null);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecordingLang(lang);
    } catch {
      setError("Micro inaccessible. Autorise l'accès au microphone.");
    }
  };

  const stopRecording = () => mediaRecorderRef.current?.stop();

  const playPending = () => {
    if (!pendingBlob) return;
    void new Audio(URL.createObjectURL(pendingBlob.blob)).play();
  };

  const validatePending = async () => {
    if (!pendingBlob || !entry) return;
    setBusy(true);
    setError(null);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(pendingBlob.blob);
      });
      const dataBase64 = dataUrl.split(",")[1];
      const text = textFor(entry, pendingBlob.lang);
      const res = await fetch("/api/recordings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          lang: pendingBlob.lang,
          mime: pendingBlob.blob.type || "audio/webm",
          dataBase64,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setRecorded((prev) =>
        new Set(prev).add(`${keyOf(text)}|${pendingBlob.lang}`)
      );
      setPendingBlob(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'envoi.");
    } finally {
      setBusy(false);
    }
  };

  const playExisting = (lang: Lang) => {
    if (!entry) return;
    void new Audio(
      `/api/recordings/play?text=${encodeURIComponent(textFor(entry, lang))}&lang=${lang}`
    ).play();
  };

  const goToNextTodo = () => {
    for (let step = 1; step <= entries.length; step++) {
      const i = (index + step) % entries.length;
      const langs = langFilter ? [langFilter] : LANGS.map((l) => l.lang);
      if (langs.some((l) => !isDone(entries[i], l))) {
        setIndex(i);
        setPendingBlob(null);
        return;
      }
    }
  };

  if (!entry) return null;

  const total = entries.length * LANGS.length;

  return (
    <div style={{ padding: 16, maxWidth: 720 }}>
      <Title title="Recording Studio" />

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h2 style={{ margin: 0 }}>🎙️ Studio d&apos;enregistrement</h2>
        <span style={{ color: "#666" }}>
          {doneCount}/{total} pistes enregistrées
        </span>
      </div>
      <div style={{ background: "#e5e7eb", borderRadius: 8, height: 10, marginTop: 8 }}>
        <div
          style={{
            width: `${(doneCount / total) * 100}%`,
            background: "#16a34a",
            height: "100%",
            borderRadius: 8,
            transition: "width .3s",
          }}
        />
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <span style={{ color: "#666", fontSize: 14, paddingTop: 4 }}>Priorité :</span>
        {[null, ...LANGS.map((l) => l.lang)].map((l) => (
          <button
            key={l ?? "all"}
            onClick={() => setLangFilter(l as Lang | null)}
            style={{
              padding: "4px 10px",
              borderRadius: 999,
              border: "1px solid #d1d5db",
              cursor: "pointer",
              background: langFilter === l ? "#dbeafe" : "#fff",
              fontWeight: langFilter === l ? 700 : 400,
            }}
          >
            {l === null ? "Tout" : LANGS.find((x) => x.lang === l)?.label}
          </button>
        ))}
      </div>

      <div
        style={{
          marginTop: 20,
          border: "2px solid #e5e7eb",
          borderRadius: 16,
          padding: 20,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ color: "#666", fontSize: 13 }}>
            Mot {index + 1}/{entries.length} · {entry.category}
          </span>
          <span>
            <button onClick={() => setIndex((index - 1 + entries.length) % entries.length)} style={{ marginRight: 8 }}>
              ← Précédent
            </button>
            <button onClick={() => setIndex((index + 1) % entries.length)} style={{ marginRight: 8 }}>
              Suivant →
            </button>
            <button onClick={goToNextTodo} style={{ fontWeight: 700 }}>
              ⏭ Prochain à faire
            </button>
          </span>
        </div>

        <h1 style={{ margin: "12px 0 2px", fontSize: 34 }}>{entry.wolof}</h1>
        <p style={{ margin: 0, color: "#666" }}>
          🇫🇷 {entry.fr} &nbsp;·&nbsp; 🇬🇧 {entry.en}
        </p>

        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
          {LANGS.map(({ lang, label, flag }) => {
            const done = isDone(entry, lang);
            const isRec = recordingLang === lang;
            const hasPending = pendingBlob?.lang === lang;
            return (
              <div
                key={lang}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: 12,
                  borderRadius: 12,
                  background: done ? "#dcfce7" : "#f3f4f6",
                  opacity: langFilter && langFilter !== lang ? 0.45 : 1,
                }}
              >
                <span style={{ width: 110, fontWeight: 700 }}>
                  {flag} {label}
                </span>
                <span style={{ flex: 1, fontStyle: "italic", color: "#374151" }}>
                  « {textFor(entry, lang)} »
                </span>
                <span title={done ? "Enregistré" : "Pas encore enregistré"}>
                  {done ? "🟢" : "⚪"}
                </span>
                {done && !isRec && !hasPending && (
                  <button onClick={() => playExisting(lang)}>▶ Écouter</button>
                )}
                {!isRec && !hasPending && (
                  <button
                    onClick={() => void startRecording(lang)}
                    disabled={recordingLang !== null}
                    style={{
                      background: "#dc2626",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      padding: "6px 12px",
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    ● {done ? "Refaire" : "Enregistrer"}
                  </button>
                )}
                {isRec && (
                  <button
                    onClick={stopRecording}
                    style={{
                      background: "#111827",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      padding: "6px 12px",
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    ■ Stop
                  </button>
                )}
                {hasPending && (
                  <>
                    <button onClick={playPending}>▶ Réécouter</button>
                    <button
                      onClick={() => void validatePending()}
                      disabled={busy}
                      style={{
                        background: "#16a34a",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        padding: "6px 12px",
                        cursor: "pointer",
                        fontWeight: 700,
                      }}
                    >
                      {busy ? "Envoi…" : "✓ Valider"}
                    </button>
                    <button onClick={() => setPendingBlob(null)} disabled={busy}>
                      ✕
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {error && (
          <p style={{ color: "crimson", marginTop: 12 }}>{error}</p>
        )}
        <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 14 }}>
          Astuce : les enregistrements sont en ligne immédiatement — les
          apprenants les entendent dès validation, sans redéploiement.
        </p>
      </div>

      <div
        style={{
          marginTop: 20,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap: 6,
        }}
      >
        {entries.map((e, i) => {
          const langs = langFilter ? [langFilter] : LANGS.map((l) => l.lang);
          const allDone = langs.every((l) => isDone(e, l));
          return (
            <button
              key={`${e.category}-${e.wolof}-${e.fr}`}
              onClick={() => {
                setIndex(i);
                setPendingBlob(null);
              }}
              style={{
                padding: "6px 8px",
                borderRadius: 8,
                border: i === index ? "2px solid #2563eb" : "1px solid #e5e7eb",
                background: allDone ? "#dcfce7" : "#f9fafb",
                color: allDone ? "#166534" : "#9ca3af",
                cursor: "pointer",
                textAlign: "left",
                fontSize: 12,
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
              }}
              title={e.wolof}
            >
              {allDone ? "🟢" : "⚪"} {e.wolof}
            </button>
          );
        })}
      </div>
    </div>
  );
};
