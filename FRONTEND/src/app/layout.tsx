import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Trabajo Decente - Plataforma de Denuncia de Abusos Laborales",
  description: "Un espacio seguro y confidencial para reportar violaciones a tus derechos laborales. Alineado con el ODS 8.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-bg text-gray-900 font-sans">
        {children}
      </body>
    </html>
  );
}
