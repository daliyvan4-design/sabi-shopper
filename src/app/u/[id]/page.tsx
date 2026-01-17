import fs from "fs";
import path from "path";

export const runtime = "nodejs";

function isImageFile(name: string) {
  const ext = name.toLowerCase().split(".").pop() || "";
  return ["jpg", "jpeg", "png", "webp", "gif"].includes(ext);
}

export default async function UploadGalleryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const dir = path.join(process.cwd(), "public", "uploads", id);

  if (!fs.existsSync(dir)) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900 }}>Galerie introuvable</h1>
        <p style={{ color: "#555" }}>
          Aucun dossier d’upload trouvé pour : <b>{id}</b>
        </p>
      </div>
    );
  }

  const files = fs
    .readdirSync(dir)
    .filter(isImageFile)
    .sort((a, b) => a.localeCompare(b));

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>
        Galerie d’images
      </h1>
      <p style={{ marginTop: 8, color: "#555" }}>
        Dossier : <b>{id}</b> • {files.length} image(s)
      </p>

      {files.length === 0 ? (
        <div
          style={{
            marginTop: 16,
            padding: 16,
            background: "#fff",
            borderRadius: 14,
            border: "1px solid rgba(0,0,0,.08)",
          }}
        >
          Aucune image trouvée dans ce dossier.
        </div>
      ) : (
        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
            gap: 12,
          }}
        >
          {files.map((name) => {
            const src = `/uploads/${id}/${name}`;
            return (
              <a
                key={name}
                href={src}
                target="_blank"
                rel="noreferrer"
                style={{
                  textDecoration: "none",
                  borderRadius: 16,
                  overflow: "hidden",
                  border: "1px solid rgba(0,0,0,.10)",
                  background: "#fff",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={name}
                  style={{
                    width: "100%",
                    height: 160,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                <div
                  style={{
                    padding: 10,
                    fontSize: 12,
                    color: "#444",
                    fontWeight: 700,
                  }}
                >
                  Ouvrir
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
