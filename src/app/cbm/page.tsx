"use client";

import { useMemo, useState } from "react";

function n(v: string) {
  const x = Number(v || 0);
  return isFinite(x) ? x : 0;
}

export default function CBMPage() {
  // Dimensions en cm (courant en logistique)
  const [l, setL] = useState("0"); // longueur
  const [w, setW] = useState("0"); // largeur
  const [h, setH] = useState("0"); // hauteur
  const [qty, setQty] = useState("1");

  // Tarif optionnel (FCFA par CBM)
  const [rate, setRate] = useState("0");

  const { cbmUnit, cbmTotal, cost } = useMemo(() => {
    const L = n(l);
    const W = n(w);
    const H = n(h);
    const Q = Math.max(1, Math.floor(n(qty) || 1));

    // CBM = (cm -> m) : (L/100)*(W/100)*(H/100)
    const unit = (L / 100) * (W / 100) * (H / 100);
    const total = unit * Q;

    const r = n(rate);
    const c = r > 0 ? total * r : 0;

    return {
      cbmUnit: unit,
      cbmTotal: total,
      cost: c,
    };
  }, [l, w, h, qty, rate]);

  const pretty = (x: number) => x.toFixed(4);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      alert("✅ Copié !");
    } catch {
      alert("❌ Impossible de copier.");
    }
  }

  const summary = `
CBM (unité): ${pretty(cbmUnit)}
Quantité: ${Math.max(1, Math.floor(n(qty) || 1))}
CBM total: ${pretty(cbmTotal)}
${n(rate) > 0 ? `Estimation transport: ${Math.round(cost).toLocaleString("fr-FR")} FCFA (tarif ${n(rate).toLocaleString("fr-FR")} FCFA/CBM)` : ""}
  `.trim();

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>📦 Calculateur CBM</h1>
      <p style={{ color: "#555", marginTop: 8 }}>
        Entre les dimensions en <b>cm</b>. CBM = m³. Utile pour estimer le volume fret.
      </p>

      <div
        style={{
          marginTop: 16,
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        }}
      >
        <Field label="Longueur (cm)" value={l} onChange={setL} />
        <Field label="Largeur (cm)" value={w} onChange={setW} />
        <Field label="Hauteur (cm)" value={h} onChange={setH} />
        <Field label="Quantité" value={qty} onChange={setQty} />
        <Field label="Tarif (FCFA / CBM) (option)" value={rate} onChange={setRate} />
      </div>

      <div style={{ marginTop: 16, background: "#fff", border: "1px solid rgba(0,0,0,.08)", borderRadius: 16, padding: 14, lineHeight: 2 }}>
        <div>CBM (unité) : <b>{pretty(cbmUnit)}</b></div>
        <div>CBM total : <b>{pretty(cbmTotal)}</b></div>
        {n(rate) > 0 && (
          <div>Estimation transport : <b>{Math.round(cost).toLocaleString("fr-FR")} FCFA</b></div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
        <button
          onClick={() => copy(summary)}
          style={{ padding: "12px 14px", borderRadius: 999, border: "1px solid rgba(0,0,0,.15)", background: "#fff", fontWeight: 900, cursor: "pointer" }}
        >
          Copier le résumé
        </button>

        <a
          href="/demande"
          style={{ padding: "12px 14px", borderRadius: 999, border: "none", background: "#111", color: "white", fontWeight: 900, textDecoration: "none" }}
        >
          Aller à Demande
        </a>

        <a
          href="/"
          style={{ padding: "12px 14px", borderRadius: 999, border: "1px solid rgba(0,0,0,.15)", background: "#fff", fontWeight: 900, textDecoration: "none" }}
        >
          Accueil
        </a>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,.08)", borderRadius: 16, padding: 12 }}>
      <div style={{ fontWeight: 900, marginBottom: 8 }}>{label}</div>
      <input
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,.15)" }}
      />
    </div>
  );
}
