import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import FirebaseAuthProvider from "@/components/firebase-auth-provider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const font = Space_Grotesk({ subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "Colabgpt",
  description: "An Team based AIchat system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <FirebaseAuthProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${font.className}`} suppressHydrationWarning>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <main className="sm:px-10 px-5">{children}</main>
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </FirebaseAuthProvider>
  );
}
