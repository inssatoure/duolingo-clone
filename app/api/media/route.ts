import { readdirSync, readFileSync, existsSync } from "fs";
import { join } from "path";

import { NextResponse } from "next/server";

import { getIsAdmin } from "@/lib/admin";

const PUBLIC_DIR = join(process.cwd(), "public");

const listDir = (rel: string, exts: string[]) => {
  const dir = join(PUBLIC_DIR, rel);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => exts.some((e) => f.endsWith(`.${e}`)))
    .sort()
    .map((f) => `/${rel}/${f}`);
};

export const GET = async () => {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return new NextResponse("Unauthorized.", { status: 401 });

  const images = listDir("vocab", ["svg", "png", "jpg", "webp"]);
  const audio = listDir("audio/wolof", ["mp3", "ogg", "wav", "m4a"]);

  const manifestPath = join(process.cwd(), "seeds", "audio-recording-manifest.json");
  const audioManifest = existsSync(manifestPath)
    ? (JSON.parse(readFileSync(manifestPath, "utf8")) as unknown[])
    : [];

  return NextResponse.json({ images, audio, audioManifest });
};
