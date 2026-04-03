"use client";

import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HexBackground from "@/components/HexBackground";
import Link from "next/link";
import { MoveRight, AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <Navbar />
      <main className="site-shell min-h-screen flex flex-col pt-[5rem]">
        <div aria-hidden="true" className="site-background">
          <div className="site-background-glow site-background-glow-primary" />
          <div className="site-background-glow site-background-glow-secondary" />
          <div className="site-background-glow site-background-glow-tertiary" />
          <HexBackground opacity={0.2} />
        </div>
        
        <div className="flex-1 flex items-center justify-center p-6 pb-24 relative z-10 w-full max-w-7xl mx-auto">
          <div className="theme-card max-w-xl w-full mx-auto text-center p-10 sm:p-14 space-y-8">
            <div className="mx-auto w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-[0_0_1.875rem_rgba(239,68,68,0.15)]">
              <AlertTriangle className="w-12 h-12 text-red-500 drop-shadow-sm" />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-red-100 to-red-300">
                System Malfunction
              </h1>
              <p className="text-base sm:text-lg theme-copy">
                An unexpected error occurred while processing your request. Our engineering team has been notified.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={() => reset()}
                className="theme-button rounded-full px-8 py-3.5 text-sm font-medium flex items-center gap-2 group w-full sm:w-auto justify-center transition-all hover:scale-[1.02]"
              >
                Try again
              </button>
              <Link
                href="/"
                className="theme-button-secondary rounded-full px-8 py-3.5 text-sm font-medium flex items-center gap-2 w-full sm:w-auto justify-center transition-all"
              >
                Return Home
                <MoveRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>

        <Footer />
      </main>
    </>
  );
}
