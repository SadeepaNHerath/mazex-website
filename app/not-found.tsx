import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HexBackground from "@/components/HexBackground";
import Link from "next/link";
import { MoveRight } from "lucide-react";

export default function NotFound() {
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
            <div className="mx-auto w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-[0_0_1.875rem_rgba(59,130,246,0.15)]">
              <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-blue-400 to-indigo-600 drop-shadow-sm">404</span>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                Page not found
              </h1>
              <p className="text-base sm:text-lg theme-copy">
                The page you are looking for doesn't exist or has been moved to another coordinate in the maze.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/"
                className="theme-button rounded-full px-8 py-3.5 text-sm font-medium flex items-center gap-2 group w-full sm:w-auto justify-center"
              >
                Return to start
                <MoveRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>

        <Footer />
      </main>
    </>
  );
}
