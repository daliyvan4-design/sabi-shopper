"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

function normalizePhone(raw: string) {
  return (raw || "").replace(/\D/g, "");
}
function toNum(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function clampInt(v: string, min = 1, max = 999) {
  const n = Math.floor(toNum(v));
  return Math.max(min, Math.min(max, n));
}

type DevisSaved = {
  clientName?: string;
  clientPhone?: string;
  waveAmount?: number;
};

export default function TransportClient({ id }: { id: string }) {
  const devisKey = `sabi_devis_${id}`;
  const transportKey = `sabi_transport_${id}`;

  // Infos client (récup depuis devis si dispo)
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [waveAmount, setWaveAmount] = useState<number>(0);

  // Transport (admin)
  const [cartons, setCartons] = useState<string>("1");
  const [lenCm, setLenCm] = useState<string>("");
  const [widCm, setWidCm] = useState<string>("");
  const [heiCm, setHeiCm] = useState<string>("");
  const [weightKg, setWeightKg] = useState<string>(""); // ✅ poids total
  const [transportFee, setTransportFee] = useState<string>(""); // FCFA
  const [note, setNote] = useState<string>(""); // tracking / infos

  // LOAD (devis + transport)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(devisKey);
      if (raw) {
        const d: unknown = JSON.parse(raw);
        if (d && typeof d === "object") {
          const dd = d as DevisSaved;
          if (typeof dd.clientName === "string") setClientName(dd.clientName);
          if (typeof dd.clientPhone === "string") setClientPhone(dd.clientPhone);
          if (typeof dd.waveAmount === "number") setWaveAmount(dd.waveAmount);
        }
      }
    } catch {}

    try {
      const rawT = localStorage.getItem(transportKey);
      if (rawT) {
        const t: unknown = JSON.parse(rawT);
        if (t && typeof t === "object") {
          const tt = t as {
            cartons?: string;
            lenCm?: string;
            widCm?: string;
            heiCm?: string;
            weightKg?: string;
            transportFee?: string;
            note?: string;
          };
          if (typeof tt.cartons === "string") setCartons(tt.cartons);
          if (typeof tt.lenCm === "string") setLenCm(tt.lenCm);
          if (typeof tt.widCm === "string") setWidCm(tt.widCm);
          if (typeof tt.heiCm === "string") setHeiCm(tt.heiCm);
          if (typeof tt.weightKg === "string") setWeightKg(tt.weightKg);
          if (typeof tt.transportFee === "string") setTransportFee(tt.transportFee);
          if (typeof tt.note === "string") setNote(tt.note);
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // SAVE transport
  useEffect(() => {
    try {
      localStorage.setItem(
        transportKey,
        JSON.stringify({
          cartons,
          lenCm,
          widCm,
          heiCm,
          weightKg,
          transportFee,
          note,
        })
      );
    } catch {}
  }, [cartons, lenCm, widCm, heiCm, weightKg, transportFee, note, transportKey]);

  const cartonsN = useMemo(() => clampInt(cartons, 1, 999), [cartons]);

  // CBM (m³) : (cm->m) puis multiplication
  const cbmUnit = useMemo(() => {
    const L = Math.max(0, toNum(lenCm));
    const W = Math.max(0, toNum(widCm));
    const H = Math.max(0, toNum(heiCm));
    return (L / 100) * (W / 100) * (H / 100);
  }, [lenCm, widCm, heiCm]);

  const cbmTotal = useMemo(() => cbmUnit * cartonsN, [cbmUnit, cartonsN]);
  const weightTotal = useMemo(() => Math.max(0, toNum(weightKg)), [weightKg]);
  const feeN = useMemo(() => Math.max(0, toNum(transportFee)), [transportFee]);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      alert("✅ Copié !");
    } catch {
      alert("❌ Impossible de copier.");
    }
  }

  function sendWhatsApp() {
    const phone = normalizePhone(clientPhone);
    if (!phone || phone.length < 8) {
      alert("Ajoute le WhatsApp du client (ex: 2250788655341).");
      return;
    }

    const base = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    const devisUrl = `${base}/devis/${id}`;
    const transportUrl = `${base}/transport/${id}`;

    const msg = `
Bonjour${clientName ? ` ${clientName}` : ""} 👋

Mise à jour transport (après commande) :

📦 Dossier : ${id}
📦 Cartons : ${cartonsN}

📐 Dimensions (cm) :
- Longueur : ${lenCm || "-"}
- Largeur : ${widCm || "-"}
- Hauteur : ${heiCm || "-"}

📏 CBM :
- 1 carton : ${cbmUnit > 0 ? cbmUnit.toFixed(4) : "-"} m³
- Total : ${cbmTotal > 0 ? cbmTotal.toFixed(4) : "-"} m³

⚖️ Poids total : ${weightTotal > 0 ? `${weightTotal.toFixed(2)} kg` : "-"}

${feeN > 0 ? `💰 Frais transport : ${Math.round(feeN).toLocaleString("fr-FR")} FCFA` : ""}

${note.trim() ? `📝 Note : ${note.trim()}` : ""}

Lien devis :
${devisUrl}

Lien transport :
${transportUrl}
    `.trim();

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
  }

  const resume = useMemo(() => {
    const parts = [
      `Dossier: ${id}`,
      `Cartons: ${cartonsN}`,
      `Dimensions(cm): ${lenCm || "-"} x ${widCm || "-"} x ${heiCm || "-"}`,
      `CBM total: ${cbmTotal.toFixed(4)} m³`,
      `Poids: ${weightTotal > 0 ? `${weightTotal.toFixed(2)} kg` : "-"}`,
      `Frais transport: ${feeN > 0 ? `${Math.round(feeN)} FCFA` : "-"}`,
    ];
    return parts.join("\n");
  }, [id, cartonsN, lenCm, widCm, heiCm, cbmTotal, weightTotal, feeN]);

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900 }}>🚚 Transport</h1>
          <div style={{ marginTop: 6, color: "#555" }}>
            Dossier : <b>{id}</b>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => copy(resume)} style={btnSecondary}>
            Copier résumé
          </button>
          <button onClick={sendWhatsApp} style={btnPrimary}>
            Envoyer au client (WhatsApp)
          </button>
        </div>
      </div>

      {/* Infos client */}
      <div style={{ marginTop: 14, display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        <Card>
          <Label>Nom client (option)</Label>
          <Input value={clientName} onChange={setClientName} placeholder="Ex: Jojo" />
        </Card>

        <Card>
          <Label>WhatsApp client</Label>
          <Input value={clientPhone} onChange={setClientPhone} placeholder="2250788655341" />
        </Card>

        <Card>
          <Label>Montant reçu Wave (option)</Label>
          <Input value={String(waveAmount || "")} onChange={(v) => setWaveAmount(toNum(v))} inputMode="numeric" placeholder="Ex: 150000" />
          <Small>Juste pour ton suivi interne.</Small>
        </Card>
      </div>

      {/* Transport */}
      <div style={{ marginTop: 12, display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        <Card>
          <Label>Nombre de cartons</Label>
          <Input value={cartons} onChange={setCartons} inputMode="numeric" placeholder="1" />
        </Card>

        <Card>
          <Label>Longueur (cm)</Label>
          <Input value={lenCm} onChange={setLenCm} inputMode="decimal" placeholder="Ex: 50" />
        </Card>

        <Card>
          <Label>Largeur (cm)</Label>
          <Input value={widCm} onChange={setWidCm} inputMode="decimal" placeholder="Ex: 40" />
        </Card>

        <Card>
          <Label>Hauteur (cm)</Label>
          <Input value={heiCm} onChange={setHeiCm} inputMode="decimal" placeholder="Ex: 30" />
        </Card>

        <Card>
          <Label>Poids total (kg)</Label>
          <Input value={weightKg} onChange={setWeightKg} inputMode="decimal" placeholder="Ex: 12.5" />
        </Card>

        <Card>
          <Label>Frais transport (FCFA) (option)</Label>
          <Input value={transportFee} onChange={setTransportFee} inputMode="numeric" placeholder="Ex: 25000" />
          <Small>Si tu veux envoyer un solde transport au client.</Small>
        </Card>

        <Card>
          <Label>Note (option)</Label>
          <Input value={note} onChange={setNote} placeholder="Tracking, délai, infos…" />
        </Card>
      </div>

      {/* Résultats */}
      <div style={resultBox}>
        <div style={{ fontWeight: 900 }}>
          Formule CBM :{" "}
          <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
            CBM = (L/100) × (l/100) × (h/100)
          </span>
        </div>

        <div>CBM (1 carton) : <b>{cbmUnit > 0 ? `${cbmUnit.toFixed(4)} m³` : "—"}</b></div>
        <div>CBM total : <b>{cbmTotal > 0 ? `${cbmTotal.toFixed(4)} m³` : "—"}</b></div>
        <div>Poids total : <b>{weightTotal > 0 ? `${weightTotal.toFixed(2)} kg` : "—"}</b></div>
        {feeN > 0 && <div>Frais transport : <b>{Math.round(feeN).toLocaleString("fr-FR")} FCFA</b></div>}
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Link href={`/devis/${id}`} style={linkBtn}>
          Retour au devis
        </Link>
      </div>
    </div>
  );
}

/* UI helpers */
function Card({ children }: { children: ReactNode }) {
  return <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,.08)", borderRadius: 16, padding: 12 }}>{children}</div>;
}
function Label({ children }: { children: ReactNode }) {
  return <div style={{ fontWeight: 900, marginBottom: 8 }}>{children}</div>;
}
function Small({ children }: { children: ReactNode }) {
  return <div style={{ marginTop: 6, fontSize: 12, color: "#666" }}>{children}</div>;
}
function Input({
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      inputMode={inputMode}
      style={inputStyle}
    />
  );
}

const inputStyle: CSSProperties = {
  width: "100%",
  padding: 12,
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,.15)",
};

const btnPrimary: CSSProperties = {
  padding: "12px 14px",
  borderRadius: 999,
  border: "none",
  background: "#111",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};

const btnSecondary: CSSProperties = {
  padding: "12px 14px",
  borderRadius: 999,
  border: "1px solid rgba(0,0,0,.15)",
  background: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};

const resultBox: CSSProperties = {
  marginTop: 14,
  background: "#fff",
  border: "1px solid rgba(0,0,0,.08)",
  borderRadius: 16,
  padding: 14,
  lineHeight: 2,
};

const linkBtn: CSSProperties = {
  padding: "12px 14px",
  borderRadius: 999,
  border: "1px solid rgba(0,0,0,.15)",
  background: "#fff",
  fontWeight: 900,
  textDecoration: "none",
  color: "#111",
};