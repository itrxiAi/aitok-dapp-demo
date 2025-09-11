"use client";

import { WalletProvider } from "@/components/WalletProvider";
import { AntdRegistry } from "@/lib/AntdRegistry";
import { Layout } from "antd";
import { ReactNode } from "react";
import MainLayout from "@/components/layout/MainLayout";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AntdRegistry>
          <WalletProvider>
            <MainLayout>{children}</MainLayout>
          </WalletProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
