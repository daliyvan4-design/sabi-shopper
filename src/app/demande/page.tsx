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

  async function uploaderEtOuvrirWhatsApp() {
    setError("");

    if (!name || !phone || !city || !files || files.length === 0) {
      setError("⚠️ Remplis les champs obligatoires et ajoute au moins 1 image.");
      return;
    }

    try {
      setLoading(true);

      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("images", f));

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data?.error || `Erreur upload (HTTP ${res.status})`);

      // Base URL (IP réseau si définie, sinon origin actuel)
      const base = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
      const galleryUrl = `${base}${data.galleryPath}`;
      const devisUrl = `${base}/devis/${data.id}`;

      // IMPORTANT: lien SEUL sur sa ligne => cliquable WhatsApp
      const message = `
Bonjour Sabi 👋

Nom : ${name}
Téléphone : ${phone}
Ville : ${city}

Détails :
${details || "-"}

${galleryUrl}
${devisUrl}
`.trim();

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
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>📸 Demande de devis</h1>
      <p style={{ marginTop: 8, color: "#555" }}>
        Upload des images sur le site → WhatsApp reçoit 1 lien galerie + 1 lien devis.
      </p>

      {error && (
        <div style={{ marginTop: 12, background: "#fff3cd", padding: 12, borderRadius: 10 }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <input placeholder="Nom & Prénoms" value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder="Téléphone / WhatsApp" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input placeholder="Ville de livraison" value={city} onChange={(e) => setCity(e.target.value)} />
        <textarea
          placeholder="Détails (couleur, taille, modèle…)"
          rows={4}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        />
        <input type="file" multiple accept="image/*" onChange={(e) => setFiles(e.target.files)} />

        <button
          onClick={uploaderEtOuvrirWhatsApp}
          disabled={loading}
          style={{
            marginTop: 8,
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

        <p style={{ fontSize: 12, color: "#666", lineHeight: 1.6 }}>
          Astuce : les liens sont sur des lignes seules → WhatsApp les rend cliquables.
        </p>
      </div>
    </div>
  );
}