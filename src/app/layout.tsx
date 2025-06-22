'use client';

import { useState } from "react";
import "./globals.css";
import { Providers } from "./providers";
import { LogoScreen } from "@/components/LogoScreen";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [showLogoScreen, setShowLogoScreen] = useState(true);

  const handleLogoScreenComplete = () => {
    setShowLogoScreen(false);
  };

  return (
    <html lang="en">
      <head>
        <title>Dream Market</title>
        <meta name="description" content="Predict the future, earn rewards" />
      </head>
      <body
        className="antialiased"
        style={{ fontFamily: '"Suisse Int\'l", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
      >
        <Providers>
          {showLogoScreen ? (
            <LogoScreen onComplete={handleLogoScreenComplete}>
              {children}
            </LogoScreen>
          ) : (
            children
          )}
        </Providers>
      </body>
    </html>
  );
}
