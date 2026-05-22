import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Unreal Engine asset path → local public path */
export function unrealPathToPublic(assetPath: string | undefined): string {
  if (!assetPath) return "";
  return `${assetPath.split(".")[0].replace("/Game", "")}.png`;
}

/** Decompress a gzipped JSON file fetched from /data/ */
export async function fetchGzJson(url: string): Promise<unknown> {
  const res = await fetch(url);
  const ds = new DecompressionStream("gzip");
  const decompressed = res.body!.pipeThrough(ds);
  return new Response(decompressed).json();
}

