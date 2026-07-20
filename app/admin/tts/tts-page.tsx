"use client";

import { useEffect, useMemo, useState } from "react";

import { Title } from "react-admin";

type Item = {
  text: string;
  lang: "fr" | "en" | "wo";
  lessonOrder: number;
  lessonLabel: string;
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
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tts/manifest")
      .then((r) => safeJson<{ items?: Item[]; error?: string }>(r))
      .then((d) => {
        if (d.error) throw new Error(d.error);
        // Items already arrive sorted chronologically (lesson 1 -> last).
        setItems(d.items ?? []);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  const filtered = useMemo(
    () => (items ?? []).filter((i) => !langFilter || i.lang === langFilter),
    [items, langFilter]
  );
  const todo = useMemo(() => filtered.filter((i) => !i.recorded), [filtered]);
  const doneCount = filtered.length - todo.length;

  // Group by lesson, preserving chronological order (Unit 1/Lesson 1 first).
  const groups = useMemo(() => {
    const map = new Map<string, { order: number; label: string; items: Item[] }>();
    for (const it of filtered) {
      const g = map.get(it.lessonLabel);
      if (g) g.items.push(it);
      else map.set(it.lessonLabel, { order: it.lessonOrder, label: it.lessonLabel, items: [it] });
    }
    return [...map.values()].sort((a, b) => a.order - b.order);
  }, [filtered]);

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
          quotaExhausted?: boolean;
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
        // Quota Gemini quotidien épuisé : inutile d'insister sur les lots
        // suivants, ils échoueront tous pareil tant que le quota n'est pas
        // réinitialisé.
        if (data.quotaExhausted) {
          setError(data.error ?? "Quota épuisé.");
          break;
        }
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
    <div style={{ padding: 16, maxWidth: 900, width: "100%", boxSizing: "border-box" }}>
      <Title title="Google TTS" />
      <h2>🔊 Voix naturelle (FR/EN/WO)</h2>
      <p style={{ color: "#666" }}>
        Français et anglais : voix Google Cloud WaveNet (naturelle, fiable).
        Génération groupée par leçon, dans l&apos;ordre du parcours : Unité 1
        / Leçon 1 en premier.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "12px 0" }}>
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
              whiteSpace: "nowrap",
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
          wolof. Ceci utilise <strong>Gemini</strong>, dont le quota gratuit
          quotidien est limité. La qualité varie{" "}
          <strong>d&apos;un essai à l&apos;autre</strong>. Un enregistrement
          natif fait dans le Studio pour le même mot remplace toujours cette
          version.
        </div>
      )}

      {isWo && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
          }}
        >
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
              whiteSpace: "nowrap",
            }}
          >
            🎧 Essayer {voice} sur {Math.min(SAMPLE_SIZE, todo.length)} mots
          </button>
        </div>
      )}

      <p>
        {doneCount}/{filtered.length} déjà générés · {todo.length} restants
      </p>
      <div style={{ background: "#e5e7eb", borderRadius: 8, height: 10 }}>
        <div
          style={{
            width: filtered.length ? `${(doneCount / filtered.length) * 100}%` : "0%",
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
          marginBottom: 20,
          padding: "10px 20px",
          fontSize: 15,
          fontWeight: 700,
          borderRadius: 8,
          border: "none",
          cursor: running || todo.length === 0 ? "default" : "pointer",
          background: running ? "#9ca3af" : "#2563eb",
          color: "#fff",
          width: "100%",
          maxWidth: 420,
        }}
      >
        {running
          ? `Génération… (${progress}/${todo.length})`
          : todo.length === 0
            ? "Tout est déjà généré"
            : `Générer les ${todo.length} pistes manquantes, dans l'ordre du parcours${isWo ? ` (voix ${voice})` : ""}`}
      </button>

      {failures.length > 0 && (
        <div style={{ marginBottom: 16, color: "crimson" }}>
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

      <h3 style={{ marginTop: 8 }}>Par leçon, dans l&apos;ordre</h3>
      {groups.map((group) => {
        const groupTodo = group.items.filter((i) => !i.recorded);
        const isOpen = expanded === group.label;
        return (
          <div
            key={group.label}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              marginBottom: 8,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                padding: 10,
                background: groupTodo.length === 0 ? "#f0fdf4" : "#f9fafb",
                cursor: "pointer",
              }}
              onClick={() => setExpanded(isOpen ? null : group.label)}
            >
              <span style={{ fontWeight: 600, fontSize: 14 }}>
                {groupTodo.length === 0 ? "✅" : "⚪"} {group.label}
                <span style={{ color: "#9ca3af", fontWeight: 400, marginLeft: 6 }}>
                  ({group.items.length - groupTodo.length}/{group.items.length})
                </span>
              </span>
              {groupTodo.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    void generate(groupTodo);
                  }}
                  disabled={running}
                  style={{
                    padding: "5px 12px",
                    fontSize: 13,
                    fontWeight: 700,
                    borderRadius: 8,
                    border: "1px solid #2563eb",
                    cursor: running ? "default" : "pointer",
                    background: "#fff",
                    color: "#2563eb",
                    whiteSpace: "nowrap",
                  }}
                >
                  Générer cette leçon ({groupTodo.length})
                </button>
              )}
            </div>

            {isOpen && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  padding: 10,
                  borderTop: "1px solid #e5e7eb",
                }}
              >
                {group.items.map((it) => (
                  <span
                    key={`${it.lang}-${it.text}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "4px 4px 4px 10px",
                      borderRadius: 999,
                      border: "1px solid #d1d5db",
                      background: it.recorded ? "#f9fafb" : "#fff7ed",
                      fontSize: 13,
                      maxWidth: "100%",
                    }}
                  >
                    {it.recorded ? (
                      <button
                        onClick={() => play(it.text, it.lang)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          wordBreak: "break-word",
                        }}
                        title={it.voice ? `Voix : ${it.voice}` : undefined}
                      >
                        ▶ {it.text}
                        {it.voice && (
                          <span style={{ color: "#9ca3af", marginLeft: 4 }}>
                            ({it.voice})
                          </span>
                        )}
                      </button>
                    ) : (
                      <span style={{ wordBreak: "break-word" }}>⚪ {it.text}</span>
                    )}
                    {it.lang === "wo" && it.recorded && (
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
                          flexShrink: 0,
                        }}
                      >
                        🔁
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 16 }}>
        FR/EN consomme le quota GOOGLE_TTS_API_KEY (Cloud Text-to-Speech).
        Wolof consomme le quota GEMINI_API_KEY (Gemini API) — deux clés
        distinctes. Les pistes sont utilisables immédiatement, sans
        redéploiement.
      </p>
    </div>
  );
};
