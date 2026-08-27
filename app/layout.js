import "./globals.css";

export const metadata = {
  title: "Controle de Contratos — Agrobiotech, Pilar, Tarpon",
  description: "Sistema de controle de contratos — Agrobiotech, Pilar, Tarpon Franca, Tarpon Araxá",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
