import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Do It Todo App",
  description: "Manage your tasks effectively!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <header className="header-container">
          <div className="logo-container">
            <Link href="/">
              <Image
                src="/doit_logo.png"
                alt="Do It Logo"
                width={100}
                height={50}
              />
            </Link>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
