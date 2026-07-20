"use client";

import { useEffect, useMemo, useState } from "react";

import { Title } from "react-admin";

type Item = { text: string; lang: "fr" | "en" | "wo"; recorded: boolean };

const BATCH_SIZE = 8;
const PAUSE_BETWEEN_BATCHES_MS = 1500;
const SAMPLE_SIZE = 3;

export const TtsPage = () => {
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [failures, setFailures] = useState<{ text: string; error?: string }[]>([]);
  const [langFilter, setLangFilter] = useState<"fr" | "en" | "wo" | null>(null);

  useEffect(() => {
    fetch("/api/tts/manifest")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<{ items: Item[] }>;
      })
      .then((d) => setItems(d.items))
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
          body: JSON.stringify({ items: batch.map(({ text, lang }) => ({ text, lang })) }),
        });
        const data = (await res.json()) as {
          results?: { text: string; ok: boolean; error?: string }[];
          error?: string;
        };
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
              ? { ...it, recorded: data.results!.find((r) => r.text === it.text)?.ok ?? it.recorded }
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
          de son orthographe. La qualité n&apos;est pas garantie.{" "}
          <strong>Écoute d&apos;abord les échantillons ci-dessous</strong>{" "}
          avant de lancer une génération en masse. Un enregistrement natif
          fait dans le Studio pour le même mot remplace toujours cette
          version.
        </div>
      )}

      {isWo && (
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
            marginBottom: 12,
          }}
        >
          🎧 Générer {Math.min(SAMPLE_SIZE, todo.length)} échantillons à écouter
        </button>
      )}

      {recordedInFilter.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontWeight: 600, marginBottom: 6 }}>
            Déjà générés — clique pour écouter :
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {recordedInFilter.slice(0, 40).map((it) => (
              <button
                key={`${it.lang}-${it.text}`}
                onClick={() => play(it.text, it.lang)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  border: "1px solid #d1d5db",
                  background: "#f9fafb",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                ▶ {it.text}
              </button>
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
            : `Générer les ${todo.length} pistes manquantes`}
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
