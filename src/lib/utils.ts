import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Unreal Engine asset path → local public path */
export function unrealPathToPublic(assetPath: string | undefined): string {
  if (!assetPath) return "";
  return `${BASE_PATH}${assetPath.split(".")[0].replace("/Game", "")}.png`;
}

/** Prefix a local path with the basePath (no-op for absolute URLs) */
export function prefixPath(path: string): string {
  return path.startsWith("http") ? path : `${BASE_PATH}${path}`;
}

/** Decompress a gzipped JSON file fetched from /data/ */
export async function fetchGzJson(url: string): Promise<unknown> {
  const prefixed = url.startsWith("http") ? url : `${BASE_PATH}${url}`;
  const res = await fetch(prefixed);
  if (!res.ok) throw new Error(`Failed to fetch "${url}": HTTP ${res.status} ${res.statusText}`);
  const ds = new DecompressionStream("gzip");
  const decompressed = res.body!.pipeThrough(ds);
  return new Response(decompressed).json();
}

