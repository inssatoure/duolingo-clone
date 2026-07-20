"use client";

import { useEffect, useMemo, useState } from "react";

import { Title } from "react-admin";

type Item = {
  text: string;
  lang: "fr" | "en" | "wo";
  recorded: boolean;
  voice?: string | null;
};

const BATCH_SIZE = 8;
const PAUSE_BETWEEN_BATCHES_MS = 1500;
const SAMPLE_SIZE = 3;

// Keep in sync with lib/gemini-tts.ts GEMINI_VOICES.
const GEMINI_VOICES = [
  "Aoede", "Zephyr", "Puck", "Charon", "Kore", "Fenrir", "Leda", "Orus",
  "Callirrhoe", "Autonoe", "Enceladus", "Iapetus", "Umbriel", "Algieba",
  "Despina", "Erinome", "Algenib", "Rasalgethi", "Laomedeia", "Achernar",
  "Alnilam", "Schedar", "Gacrux", "Pulcherrima", "Achird", "Zubenelgenubi",
  "Vindemiatrix", "Sadachbia", "Sadaltager", "Sulafat",
];

/** Parses a fetch Response as JSON, but never throws a cryptic "Unexpected
 * token" error if the server returned an HTML error page instead (e.g. a
 * platform-level 500) - surfaces the raw text so the real problem shows. */
const safeJson = async <T,>(res: Response): Promise<T> => {
  const raw = await res.text();
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(
      `Server returned a non-JSON response (HTTP ${res.status}): ${raw.slice(0, 200)}`
    );
  }
};

export const TtsPage = () => {
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [failures, setFailures] = useState<{ text: string; error?: string }[]>([]);
  const [langFilter, setLangFilter] = useState<"fr" | "en" | "wo" | null>(null);
  const [voice, setVoice] = useState("Aoede");

  useEffect(() => {
    fetch("/api/tts/manifest")
      .then((r) => safeJson<{ items?: Item[]; error?: string }>(r))
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setItems(d.items ?? []);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  const todo = useMemo(
    () =>
      (items ?? []).filter(
        (i) => !i.recorded && (!langFilter || i.lang === langFilter)
      ),
    [items, langFilter]
  );
  const doneCount = (items ?? []).filter(
    (i) => i.recorded && (!langFilter || i.lang === langFilter)
  ).length;
  const total = (items ?? []).filter(
    (i) => !langFilter || i.lang === langFilter
  ).length;
  const recordedInFilter = (items ?? []).filter(
    (i) => i.recorded && (!langFilter || i.lang === langFilter)
  );

  const generate = async (queueItems: Item[]) => {
    setRunning(true);
    setFailures([]);
    setProgress(0);

    const queue = [...queueItems];
    let done = 0;
    while (queue.length > 0) {
      const batch = queue.splice(0, BATCH_SIZE);
      try {
        const res = await fetch("/api/tts/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: batch.map(({ text, lang }) => ({
              text,
              lang,
              ...(lang === "wo" ? { voice } : {}),
            })),
          }),
        });
        const data = await safeJson<{
          results?: { text: string; ok: boolean; error?: string }[];
          error?: string;
        }>(res);
        if (!res.ok || !data.results) {
          setError(data.error ?? `HTTP ${res.status}`);
          break;
        }
        for (const r of data.results) {
          if (!r.ok) setFailures((prev) => [...prev, { text: r.text, error: r.error }]);
        }
        done += batch.length;
        setProgress(done);
        setItems((prev) =>
          prev?.map((it) =>
            batch.some((b) => b.text === it.text && b.lang === it.lang)
              ? {
                  ...it,
                  recorded: data.results!.find((r) => r.text === it.text)?.ok ?? it.recorded,
                  voice: it.lang === "wo" ? voice : it.voice,
                }
              : it
          ) ?? prev
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Request failed");
        break;
      }
      if (queue.length > 0)
        await new Promise((r) => setTimeout(r, PAUSE_BETWEEN_BATCHES_MS));
    }
    setRunning(false);
  };

  const play = (text: string, lang: string) => {
    void new Audio(
      `/api/recordings/play?text=${encodeURIComponent(text)}&lang=${lang}`
    ).play();
  };

  if (error)
    return <p style={{ padding: 16, color: "crimson" }}>Erreur : {error}</p>;
  if (!items) return <p style={{ padding: 16 }}>Chargement du catalogue…</p>;

  const isWo = langFilter === "wo";

  return (
    <div style={{ padding: 16, maxWidth: 720 }}>
      <Title title="Google TTS" />
      <h2>🔊 Voix naturelle (FR/EN/WO)</h2>
      <p style={{ color: "#666" }}>
        Français et anglais : voix Google Cloud WaveNet (naturelle, fiable).
      </p>

      <div style={{ display: "flex", gap: 8, margin: "12px 0" }}>
        {[null, "fr", "en", "wo"].map((l) => (
          <button
            key={l ?? "all"}
            onClick={() => setLangFilter(l as "fr" | "en" | "wo" | null)}
            style={{
              padding: "4px 12px",
              borderRadius: 999,
              border: "1px solid #d1d5db",
              cursor: "pointer",
              background: langFilter === l ? "#dbeafe" : "#fff",
              fontWeight: langFilter === l ? 700 : 400,
            }}
          >
            {l === null
              ? "Tout"
              : l === "fr"
                ? "🇫🇷 Français"
                : l === "en"
                  ? "🇬🇧 English"
                  : "🇸🇳 Wolof (expérimental)"}
          </button>
        ))}
      </div>

      {isWo && (
        <div
          style={{
            background: "#fef3c7",
            border: "1px solid #f59e0b",
            borderRadius: 8,
            padding: 10,
            fontSize: 14,
            marginBottom: 12,
          }}
        >
          ⚠️ <strong>Expérimental</strong> — Google Cloud n&apos;a aucune voix
          wolof. Ceci utilise <strong>Gemini</strong> (un modèle de langage,
          pas un moteur TTS dédié) pour tenter de prononcer le wolof à partir
          de son orthographe. La qualité varie <strong>d&apos;un essai à
          l&apos;autre, même avec la même voix</strong> — ce n&apos;est pas un
          moteur déterministe. Écoute avant de générer en masse. Un
          enregistrement natif fait dans le Studio pour le même mot remplace
          toujours cette version.
        </div>
      )}

      {isWo && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <label htmlFor="voice-select" style={{ fontSize: 14, fontWeight: 600 }}>
            Voix Gemini :
          </label>
          <select
            id="voice-select"
            value={voice}
            onChange={(e) => setVoice(e.target.value)}
            style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #d1d5db" }}
          >
            {GEMINI_VOICES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <button
            onClick={() => void generate(todo.slice(0, SAMPLE_SIZE))}
            disabled={running || todo.length === 0}
            style={{
              padding: "8px 16px",
              fontSize: 14,
              fontWeight: 700,
              borderRadius: 8,
              border: "1px solid #f59e0b",
              cursor: running || todo.length === 0 ? "default" : "pointer",
              background: "#fff",
              color: "#b45309",
            }}
          >
            🎧 Essayer {voice} sur {Math.min(SAMPLE_SIZE, todo.length)} mots
          </button>
        </div>
      )}

      {recordedInFilter.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontWeight: 600, marginBottom: 6 }}>
            Déjà générés — clique pour écouter :
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {recordedInFilter.slice(0, 60).map((it) => (
              <span
                key={`${it.lang}-${it.text}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 4px 4px 10px",
                  borderRadius: 999,
                  border: "1px solid #d1d5db",
                  background: "#f9fafb",
                  fontSize: 13,
                }}
              >
                <button
                  onClick={() => play(it.text, it.lang)}
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                  title={it.voice ? `Voix : ${it.voice}` : undefined}
                >
                  ▶ {it.text}
                  {it.voice && (
                    <span style={{ color: "#9ca3af", marginLeft: 4 }}>
                      ({it.voice})
                    </span>
                  )}
                </button>
                {it.lang === "wo" && (
                  <button
                    onClick={() => void generate([it])}
                    disabled={running}
                    title={`Régénérer avec ${voice}`}
                    style={{
                      background: "#fff",
                      border: "1px solid #d1d5db",
                      borderRadius: 999,
                      width: 20,
                      height: 20,
                      cursor: running ? "default" : "pointer",
                      fontSize: 11,
                    }}
                  >
                    🔁
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      <p>
        {doneCount}/{total} déjà générés · {todo.length} restants
      </p>
      <div style={{ background: "#e5e7eb", borderRadius: 8, height: 10 }}>
        <div
          style={{
            width: total ? `${(doneCount / total) * 100}%` : "0%",
            background: "#2563eb",
            height: "100%",
            borderRadius: 8,
            transition: "width .3s",
          }}
        />
      </div>

      <button
        onClick={() => void generate(todo)}
        disabled={running || todo.length === 0}
        style={{
          marginTop: 16,
          padding: "10px 20px",
          fontSize: 15,
          fontWeight: 700,
          borderRadius: 8,
          border: "none",
          cursor: running || todo.length === 0 ? "default" : "pointer",
          background: running ? "#9ca3af" : "#2563eb",
          color: "#fff",
        }}
      >
        {running
          ? `Génération… (${progress}/${todo.length})`
          : todo.length === 0
            ? "Tout est déjà généré"
            : `Générer les ${todo.length} pistes manquantes${isWo ? ` (voix ${voice})` : ""}`}
      </button>

      {failures.length > 0 && (
        <div style={{ marginTop: 16, color: "crimson" }}>
          <strong>{failures.length} échec(s) :</strong>
          <ul>
            {failures.slice(0, 10).map((f, i) => (
              <li key={i}>
                {f.text} — {f.error}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 16 }}>
        FR/EN consomme le quota GOOGLE_TTS_API_KEY (Cloud Text-to-Speech).
        Wolof consomme le quota GEMINI_API_KEY (Gemini API) — deux clés
        distinctes. Les pistes sont utilisables immédiatement, sans
        redéploiement.
      </p>
    </div>
  );
};
