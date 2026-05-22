import { readdir } from "fs/promises";
import { join } from "path";

/**
 * GET /api/models/weapons
 * Returns a list of weapon IDs that have a .glb file in public/models/weapons/
 */
export async function GET() {
  const dir = join(process.cwd(), "public", "models", "weapons");
  try {
    const files = await readdir(dir);
    const ids = files
      .filter((f) => f.endsWith(".glb"))
      .map((f) => f.replace(".glb", ""));
    return Response.json(ids);
  } catch {
    return Response.json([]);
  }
}

