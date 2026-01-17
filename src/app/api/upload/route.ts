import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "edge";

function isImageFile(file: File) {
  const name = (file.name || "").toLowerCase();
  const ext = name.split(".").pop() || "";
  const okExt = ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"].includes(ext);
  const okType = (file.type || "").startsWith("image/");
  // iPhone: parfois type vide → on accepte si extension OK
  return okType || okExt;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    // ✅ IMPORTANT: on garde "images" pour ne pas casser ton front actuel
    const raw = formData.getAll("images");
    const images = raw.filter((f): f is File => f instanceof File);

    if (!images || images.length === 0) {
      return NextResponse.json({ ok: false, error: "Aucune image reçue" }, { status: 400 });
    }

    const id = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    const uploads: Array<{ url: string; pathname: string; name: string; size: number; type: string }> = [];
    const skipped: string[] = [];

    for (const img of images) {
      const name = img.name || "image";
      if (!isImageFile(img)) {
        skipped.push(name);
        continue;
      }

      // limite 12MB comme avant
      if (img.size > 12 * 1024 * 1024) {
        return NextResponse.json({ ok: false, error: "Image trop lourde (max 12MB)" }, { status: 413 });
      }

      const ext = (name.split(".").pop() || "jpg").toLowerCase();
      const key = `uploads/${id}/${crypto.randomUUID()}.${ext}`;

      const blob = await put(key, img, { access: "public" });

      uploads.push({
        url: blob.url,
        pathname: blob.pathname,
        name,
        size: img.size,
        type: img.type,
      });
    }

    if (uploads.length === 0) {
      return NextResponse.json({ ok: false, error: "Aucune image sauvegardée", skipped }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      id,
      uploads,
      // tes routes existantes (tu gardes la logique)
      galleryPath: `/u/${id}`,
      devisPath: `/devis/${id}`,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "Upload impossible" }, { status: 500 });
  }
}
