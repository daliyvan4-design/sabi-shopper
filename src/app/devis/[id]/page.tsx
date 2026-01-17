import fs from "fs";
import path from "path";
import DevisClient from "./DevisClient";

export const runtime = "nodejs";

function isVisibleFile(name: string) {
  // ignore fichiers cachés/mac
  if (!name) return false;
  if (name.startsWith(".")) return false; // .DS_Store, etc.
  return true;
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const dir = path.join(process.cwd(), "public", "uploads", id);
  let urls: string[] = [];

  if (fs.existsSync(dir)) {
    const files = fs
      .readdirSync(dir)
      .filter(isVisibleFile)
      .sort((a, b) => a.localeCompare(b));

    urls = files.map((f) => `/uploads/${id}/${f}`);
  }

  return <DevisClient id={id} initialUrls={urls} />;
}
