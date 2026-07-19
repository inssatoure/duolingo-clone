import { and, asc, desc, eq, inArray, type AnyColumn } from "drizzle-orm";
import { type PgTableWithColumns } from "drizzle-orm/pg-core";
import { type NextRequest, NextResponse } from "next/server";

import db from "@/db/drizzle";

/**
 * Serves a react-admin (ra-data-simple-rest) list request for a table:
 * parses `range`, `sort` and `filter` query params, applies them, and
 * returns the page with the `Content-Range` header the client requires.
 */
export const adminListResponse = async (
  req: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: PgTableWithColumns<any>,
  resource: string
) => {
  const params = req.nextUrl.searchParams;

  let start = 0;
  let end = 24;
  try {
    const range = JSON.parse(params.get("range") ?? "[0,24]") as number[];
    if (Array.isArray(range) && range.length === 2) [start, end] = range;
  } catch {
    /* keep defaults */
  }

  let sortField = "id";
  let sortOrder = "ASC";
  try {
    const sort = JSON.parse(params.get("sort") ?? '["id","ASC"]') as string[];
    if (Array.isArray(sort) && sort.length === 2) [sortField, sortOrder] = sort;
  } catch {
    /* keep defaults */
  }

  let filter: Record<string, unknown> = {};
  try {
    filter = JSON.parse(params.get("filter") ?? "{}") as Record<string, unknown>;
  } catch {
    /* keep defaults */
  }

  const columns = table as unknown as Record<string, AnyColumn>;
  const sortColumn = columns[sortField] ?? columns.id;

  const conditions = Object.entries(filter)
    .filter(([key]) => columns[key])
    .map(([key, value]) =>
      Array.isArray(value)
        ? inArray(columns[key], value)
        : eq(columns[key], value)
    );

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  let query = db
    .select()
    .from(table)
    .orderBy(sortOrder === "DESC" ? desc(sortColumn) : asc(sortColumn))
    .limit(end - start + 1)
    .offset(start)
    .$dynamic();
  if (where) query = query.where(where);

  const [rows, total] = await Promise.all([
    query,
    where ? db.$count(table, where) : db.$count(table),
  ]);

  return NextResponse.json(rows, {
    headers: {
      "Content-Range": `${resource} ${start}-${Math.max(start, Math.min(end, start + rows.length - 1))}/${total}`,
      "Access-Control-Expose-Headers": "Content-Range",
    },
  });
};
