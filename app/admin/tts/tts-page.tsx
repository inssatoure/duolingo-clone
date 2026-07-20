"use client";

import { useEffect, useMemo, useState } from "react";

import { Title } from "react-admin";

type Item = { text: string; lang: "fr" | "en" | "wo"; recorded: boolean };

const BATCH_SIZE = 8;
const PAUSE_BETWEEN_BATCHES_MS = 1500;

export const TtsPage = () => {
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [failures, setFailures] = useState<{ text: string; error?: string }[]>([]);
  const [langFilter, setLangFilter] = useState<"fr" | "en" | "wo" | null>("fr");

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

  const run = async () => {
    if (!items) return;
    setRunning(true);
    setFailures([]);
    setProgress(0);

    const queue = [...todo];
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

  if (error)
    return <p style={{ padding: 16, color: "crimson" }}>Erreur : {error}</p>;
  if (!items) return <p style={{ padding: 16 }}>Chargement du catalogue…</p>;

  return (
    <div style={{ padding: 16, maxWidth: 720 }}>
      <Title title="Google TTS" />
      <h2>🔊 Voix naturelle Google (FR/EN)</h2>
      <p style={{ color: "#666" }}>
        Génère automatiquement l&apos;audio des mots du dictionnaire, des
        textes de l&apos;interface et des questions complètes des cours
        &laquo;&nbsp;depuis le français&nbsp;&raquo; et
        &laquo;&nbsp;from English&nbsp;&raquo;, avec une voix Google
        WaveNet naturelle.
      </p>

      {langFilter === "wo" && (
        <div
          style={{
            background: "#fef3c7",
            border: "1px solid #f59e0b",
            borderRadius: 8,
            padding: 10,
            fontSize: 14,
            marginBottom: 8,
          }}
        >
          ⚠️ <strong>Bêta</strong> — voix Google Chirp3-HD &laquo;Autonoe&raquo;
          sur le wolof. Vérifie la prononciation avant de t&apos;y fier à
          grande échelle. Un enregistrement natif fait dans le Studio pour le
          même mot remplace automatiquement cette version TTS.
        </div>
      )}

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
                  : "🇸🇳 Wolof (bêta)"}
          </button>
        ))}
      </div>

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
        onClick={() => void run()}
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
        Ceci consomme le quota de ta clé Google Cloud Text-to-Speech
        (GOOGLE_TTS_API_KEY). Les pistes sont utilisables immédiatement, sans
        redéploiement.
      </p>
    </div>
  );
};
