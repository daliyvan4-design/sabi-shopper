import "./globals.css";

export const metadata = {
  title: "Sabi Personal Shopper Chine",
  description: "Envoie des images, devis, paiement Wave, reçus & suivi.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial" }}>
        <div style={{ position: "sticky", top: 0, background: "rgba(255,255,255,.85)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(0,0,0,.08)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "12px 16px", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <strong>Sabi Personal Shopper</strong>
            <span style={{ fontWeight: 700, color: "#444" }}>Taux: <b style={{ color: "#d98b2b" }}>1 yuan = 100 FCFA</b> • Paiement: <b style={{ color: "#16a34a" }}>Wave</b></span>
          </div>
        </div>
        <main style={{ maxWidth: 1100, margin: "0 auto", padding: "18px 16px" }}>{children}</main>
      </body>
    </html>
  );
}
