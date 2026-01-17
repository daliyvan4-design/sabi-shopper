"use client";

import { useState } from "react";

export default function DemandePage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [details, setDetails] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function envoyer() {
    setError("");

    if (!name.trim() || !phone.trim() || !city.trim()) {
      setError("⚠️ Remplis Nom, Téléphone et Ville.");
      return;
    }
    if (!files || files.length === 0) {
      setError("⚠️ Ajoute au moins 1 image.");
      return;
    }

    try {
      setLoading(true);

      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("images", f));

      // 1) Upload images
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || `Erreur upload (HTTP ${res.status})`);
      }

      const base = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;

      // 2) URLs
      const galleryUrl = `${base}${data.galleryPath}`; // ex: /u/xxxx
      const devisUrl = `${base}/devis/${data.id}`; // page devis (si tu l'as créée)

      // 3) Message WhatsApp
      // IMPORTANT: liens SEULS sur leurs lignes => plus de chances d'être cliquables
      const message = `
Bonjour Sabi 👋
Nouvelle demande Sabi Personal Shopper Chine.

Nom : ${name}
Téléphone : ${phone}
Ville : ${city}

Détails :
${details || "-"}

${galleryUrl}
${devisUrl}
      `.trim();

      // 4) Ouvrir WhatsApp
      window.open(
        `https://wa.me/2250788655341?text=${encodeURIComponent(message)}`,
        "_blank",
        "noopener,noreferrer"
      );
    } catch (e: any) {
      setError(`❌ Upload impossible : ${e?.message || "Erreur inconnue"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>📸 Demande de devis</h1>
      <p style={{ marginTop: 8, color: "#555", lineHeight: 1.6 }}>
        Ajoute les images, puis on envoie à Sabi un <b>lien unique</b> (galerie) + un lien devis.
        <br />
        <span style={{ fontSize: 12, color: "#777" }}>
          Note : WhatsApp n’attache pas automatiquement les images, on envoie des liens.
        </span>
      </p>

      {error && (
        <div style={{ marginTop: 12, background: "#fff3cd", padding: 12, borderRadius: 10 }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <input
          placeholder="Nom & Prénoms"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,.15)" }}
        />
        <input
          placeholder="Téléphone / WhatsApp"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,.15)" }}
        />
        <input
          placeholder="Ville de livraison"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,.15)" }}
        />
        <textarea
          placeholder="Détails (couleur, taille, modèle…)"
          rows={4}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,.15)" }}
        />

        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => setFiles(e.target.files)}
          style={{ padding: 10 }}
        />

        <button
          onClick={envoyer}
          disabled={loading}
          style={{
            padding: "14px",
            borderRadius: 999,
            background: loading ? "#999" : "#16a34a",
            color: "white",
            fontWeight: 900,
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Upload en cours..." : "Uploader & envoyer WhatsApp"}
        </button>
      </div>
    </div>
  );
}