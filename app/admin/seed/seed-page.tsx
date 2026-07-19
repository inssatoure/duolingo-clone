"use client";

import { useState } from "react";

import { Title } from "react-admin";

type SeedResult = {
  ok: boolean;
  error?: string;
  seedVersion?: string;
  counts?: {
    courses: number;
    units: number;
    lessons: number;
    challenges: number;
    options: number;
  };
};

export const SeedPage = () => {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SeedResult | null>(null);

  const run = async () => {
    if (
      !window.confirm(
        "This will REPLACE all course content (courses, units, lessons, exercises) " +
          "with the bundled seed data, and reset every learner's lesson progress. " +
          "User accounts, points, hearts, streaks and purchases are kept. Continue?"
      )
    )
      return;
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      setResult((await res.json()) as SeedResult);
    } catch (e) {
      setResult({ ok: false, error: e instanceof Error ? e.message : "Request failed" });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ padding: 16, maxWidth: 640 }}>
      <Title title="Seed Database" />
      <h2>Load course content into the database</h2>
      <p style={{ color: "#666" }}>
        Publishes the content shipped with this deployment (
        <code>seeds/wolof-course.json</code>) to the live database: both Wolof
        courses with all their units, lessons, exercises, images and audio
        links. Run this after each deployment that changes the seed content.
      </p>
      <ul style={{ color: "#666", fontSize: 14 }}>
        <li>Replaces all courses/units/lessons/exercises</li>
        <li>Resets learners&apos; lesson progress and active course</li>
        <li>Keeps accounts, points, hearts, streaks, purchases, leagues</li>
      </ul>
      <button
        onClick={() => void run()}
        disabled={running}
        style={{
          padding: "10px 20px",
          fontSize: 15,
          fontWeight: 600,
          borderRadius: 8,
          border: "none",
          cursor: running ? "wait" : "pointer",
          background: running ? "#9ca3af" : "#16a34a",
          color: "#fff",
        }}
      >
        {running ? "Seeding… (can take up to a minute)" : "Seed database now"}
      </button>

      {result && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 8,
            background: result.ok ? "#dcfce7" : "#fee2e2",
          }}
        >
          {result.ok ? (
            <>
              <strong>Done!</strong> Seed version {result.seedVersion}:{" "}
              {result.counts?.courses} courses, {result.counts?.units} units,{" "}
              {result.counts?.lessons} lessons, {result.counts?.challenges}{" "}
              exercises, {result.counts?.options} options.
            </>
          ) : (
            <>
              <strong>Failed:</strong> {result.error}
            </>
          )}
        </div>
      )}
    </div>
  );
};
