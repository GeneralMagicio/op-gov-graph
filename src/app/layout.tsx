import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";
import { TRPCReactProvider } from "@/trpc/react";
import WagmiWrapper from "./providers/WagmiProvider";

const poppins = Poppins({ weight: ["400", "600", "700"], subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OP GovGraph",
  description: "OP GovGraph",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${poppins.className}`}>
        <WagmiWrapper>
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </WagmiWrapper>
      </body>
      <GoogleAnalytics gaId="G-63J6DVWXVK" />
    </html>
  );
}
