import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";

function isImageByName(name: string) {
  const ext = (name.split(".").pop() || "").toLowerCase();
  return ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"].includes(ext);
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const images = formData.getAll("images") as File[];

    if (!images || images.length === 0) {
      return NextResponse.json({ error: "Aucune image reçue" }, { status: 400 });
    }

    const id = crypto.randomBytes(8).toString("hex");
    const uploadDir = path.join(process.cwd(), "public", "uploads", id);
    fs.mkdirSync(uploadDir, { recursive: true });

    let savedCount = 0;
    const skipped: string[] = [];

    for (const img of images) {
      const name = img.name || "image";
      const okByType = (img.type || "").startsWith("image/");
      const okByName = isImageByName(name);

      // ✅ on accepte si type OK OU extension OK (utile quand type est vide sur iPhone)
      if (!okByType && !okByName) {
        skipped.push(name);
        continue;
      }

      const bytes = Buffer.from(await img.arrayBuffer());
      if (bytes.length > 12 * 1024 * 1024) {
        return NextResponse.json({ error: "Image trop lourde (max 12MB)" }, { status: 413 });
      }

      const ext = name.includes(".") ? name.split(".").pop() : "jpg";
      const filename = `${crypto.randomBytes(6).toString("hex")}.${(ext || "jpg").toLowerCase()}`;
      fs.writeFileSync(path.join(uploadDir, filename), bytes);
      savedCount++;
    }

    if (savedCount === 0) {
      return NextResponse.json(
        { error: "Aucune image sauvegardée", skipped },
        { status: 400 }
      );
    }

    return NextResponse.json({
      id,
      galleryPath: `/u/${id}`,
      savedCount,
      receivedCount: images.length,
      skipped,
    });
  } catch (err: any) {
    console.error("UPLOAD_ERROR:", err);
    return NextResponse.json({ error: err?.message || "Erreur serveur upload" }, { status: 500 });
  }
}
