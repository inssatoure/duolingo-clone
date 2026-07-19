"use client";

import Papa from "papaparse";
import { useState } from "react";
import { Title, useDataProvider, useNotify } from "react-admin";

interface ImportRow {
  lesson_title: string;
  lesson_order: string;
  challenge_type: string;
  question: string;
  challenge_order: string;
  option_text: string;
  option_correct: string;
  option_image_src?: string;
  option_audio_src?: string;
}

interface UnitOption {
  id: number;
  title: string;
}

/**
 * Custom react-admin page: bulk-import lessons/challenges/challengeOptions
 * for a single unit from a CSV file.
 *
 * CSV columns (see seeds/csv-import-template.csv for a full example):
 *   lesson_title, lesson_order, challenge_type, question, challenge_order,
 *   option_text, option_correct, option_image_src, option_audio_src
 *
 * One row = one challenge option. Rows sharing the same lesson_title +
 * lesson_order become one lesson; rows sharing the same challenge_order +
 * question + challenge_type (within a lesson) become one challenge with
 * multiple options.
 */
export const CsvImportPage = () => {
  const notify = useNotify();
  const dataProvider = useDataProvider();

  const [units, setUnits] = useState<UnitOption[]>([]);
  const [unitId, setUnitId] = useState<number | "">("");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<null | {
    lessonsCreated: number;
    challengesCreated: number;
    optionsCreated: number;
  }>(null);

  const loadUnits = async () => {
    const { data } = await dataProvider.getList("units", {
      pagination: { page: 1, perPage: 500 },
      sort: { field: "id", order: "ASC" },
      filter: {},
    });
    setUnits(data as UnitOption[]);
  };

  useState(() => {
    loadUnits();
  });

  const handleFile = (file: File) => {
    setFileName(file.name);
    setResult(null);
    Papa.parse<ImportRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const errors: string[] = [];
        res.data.forEach((row, i) => {
          if (!row.lesson_title) errors.push(`Row ${i + 2}: missing lesson_title`);
          if (!row.challenge_type || !["SELECT", "ASSIST"].includes(row.challenge_type)) {
            errors.push(`Row ${i + 2}: challenge_type must be SELECT or ASSIST`);
          }
          if (!row.question) errors.push(`Row ${i + 2}: missing question`);
          if (!row.option_text) errors.push(`Row ${i + 2}: missing option_text`);
        });
        setParseErrors(errors);
        setRows(res.data);
      },
      error: (err) => {
        notify(`Failed to parse CSV: ${err.message}`, { type: "error" });
      },
    });
  };

  const handleImport = async () => {
    if (!unitId) {
      notify("Choose a unit first.", { type: "warning" });
      return;
    }
    if (rows.length === 0) {
      notify("Upload a CSV file first.", { type: "warning" });
      return;
    }
    if (parseErrors.length > 0) {
      notify("Fix CSV validation errors before importing.", { type: "error" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitId, rows }),
      });
      const json = await res.json();
      if (!res.ok) {
        notify(`Import failed: ${json.error ?? res.statusText}`, { type: "error" });
        return;
      }
      setResult(json.summary);
      notify("Import succeeded.", { type: "success" });
    } catch (e) {
      notify(`Import failed: ${(e as Error).message}`, { type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <Title title="CSV Import" />
      <h2>Bulk import lessons &amp; challenges from CSV</h2>
      <p>
        Upload a CSV of lessons/challenges/options for a single unit. Columns:{" "}
        <code>
          lesson_title, lesson_order, challenge_type, question, challenge_order,
          option_text, option_correct, option_image_src, option_audio_src
        </code>
        . One row per option. See <code>seeds/csv-import-template.csv</code> for
        a template.
      </p>

      <div style={{ marginBottom: 16 }}>
        <label htmlFor="unit-select">Unit: </label>
        <select
          id="unit-select"
          value={unitId}
          onChange={(e) => setUnitId(e.target.value ? Number(e.target.value) : "")}
        >
          <option value="">-- select a unit --</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.id} - {u.title}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {fileName && <p>Loaded: {fileName} ({rows.length} rows)</p>}
      </div>

      {parseErrors.length > 0 && (
        <div style={{ color: "red", marginBottom: 16 }}>
          <strong>Validation errors:</strong>
          <ul>
            {parseErrors.slice(0, 20).map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <button onClick={handleImport} disabled={submitting || rows.length === 0}>
        {submitting ? "Importing..." : "Import CSV"}
      </button>

      {result && (
        <div style={{ marginTop: 16 }}>
          <strong>Done:</strong> {result.lessonsCreated} lessons,{" "}
          {result.challengesCreated} challenges, {result.optionsCreated} options
          created.
        </div>
      )}
    </div>
  );
};
