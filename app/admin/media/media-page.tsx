"use client";

import { useEffect, useState } from "react";

import { Title } from "react-admin";

type ManifestEntry = {
  wolof: string;
  fr: string;
  en: string;
  expectedFile: string;
  recorded: boolean;
};

type MediaData = {
  images: string[];
  audio: string[];
  audioManifest: ManifestEntry[];
};

export const MediaPage = () => {
  const [data, setData] = useState<MediaData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/media")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<MediaData>;
      })
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  const copy = (path: string) => {
    void navigator.clipboard.writeText(path);
    setCopied(path);
    setTimeout(() => setCopied(null), 1200);
  };

  if (error) return <p style={{ padding: 16, color: "crimson" }}>Failed to load media: {error}</p>;
  if (!data) return <p style={{ padding: 16 }}>Loading media library…</p>;

  const recordedCount = data.audioManifest.filter((m) => m.recorded).length;

  return (
    <div style={{ padding: 16 }}>
      <Title title="Media Library" />
      <h2>Images ({data.images.length})</h2>
      <p style={{ color: "#666" }}>
        Click a card to copy its path, then paste it into a challenge option&apos;s
        &quot;Image URL&quot; field or the CSV <code>option_image_src</code> column.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {data.images.map((src) => (
          <button
            key={src}
            onClick={() => copy(src)}
            title={src}
            style={{
              width: 96,
              cursor: "pointer",
              border: copied === src ? "2px solid #22c55e" : "1px solid #ddd",
              borderRadius: 8,
              background: "#fff",
              padding: 4,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={src} style={{ width: "100%" }} />
            <span style={{ fontSize: 10, wordBreak: "break-all" }}>
              {copied === src ? "Copied!" : src.replace("/vocab/", "")}
            </span>
          </button>
        ))}
      </div>

      <h2 style={{ marginTop: 32 }}>
        Audio recordings ({recordedCount}/{data.audioManifest.length} recorded)
      </h2>
      <p style={{ color: "#666" }}>
        Record each word with a native speaker and add the file at the expected
        path (commit it to the repo, or upload via your host). Once the file
        exists, re-run <code>npx tsx scripts/generate-wolof-content.ts</code> and
        re-seed, or set the path directly on challenge options here in the admin.
      </p>
      <table style={{ borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {["Wolof", "Français", "English", "Expected file", "Status"].map((h) => (
              <th key={h} style={{ textAlign: "left", padding: "4px 12px 4px 0", borderBottom: "1px solid #ccc" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.audioManifest.map((m) => (
            <tr key={m.expectedFile}>
              <td style={{ padding: "3px 12px 3px 0", fontWeight: 600 }}>{m.wolof}</td>
              <td style={{ padding: "3px 12px 3px 0" }}>{m.fr}</td>
              <td style={{ padding: "3px 12px 3px 0" }}>{m.en}</td>
              <td style={{ padding: "3px 12px 3px 0" }}>
                <button
                  onClick={() => copy(m.expectedFile)}
                  style={{ cursor: "pointer", border: "none", background: "none", padding: 0, fontFamily: "monospace", fontSize: 12 }}
                >
                  {copied === m.expectedFile ? "Copied!" : m.expectedFile}
                </button>
              </td>
              <td style={{ padding: "3px 0" }}>{m.recorded ? "✅" : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
