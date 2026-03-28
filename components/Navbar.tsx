"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import { NAV_LINKS } from "@/lib/constants";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-5">
      <div className="mx-auto max-w-7xl rounded-[1.6rem] border border-[#303959]/80 bg-[#070E1A]/82 backdrop-blur-2xl shadow-[0_20px_60px_rgba(2,6,23,0.35)]">
        <div className="rounded-[1.6rem] px-4 sm:px-6 lg:px-8">
          <div className="flex h-[72px] items-center justify-between">
            <a href="#" className="flex items-center hover:opacity-90 transition-opacity">
              <Image
                src="/images/brand/logo-white.svg"
                alt="MazeX Logo"
                width={100}
                height={56}
                className="h-10 w-auto object-contain"
                priority
              />
            </a>

            <div className="hidden items-center gap-4 md:flex">
              <div className="flex items-center gap-2 rounded-full border border-[#26304d] bg-[#0b1427]/85 px-3 py-2">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="rounded-full px-4 py-2 text-sm font-medium text-[#c9bedb] hover:bg-[#151f37] hover:text-[#F8FAFC]"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
              <a
                href="#register"
                className="theme-button theme-button-register rounded-full px-5 py-2 text-sm font-semibold"
              >
                Register Now
              </a>
            </div>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="rounded-full border border-[#303959] bg-[#0b1427]/90 p-2 text-[#EAF6FF] md:hidden"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mx-auto mt-3 max-w-7xl overflow-hidden rounded-[1.6rem] border border-[#303959]/80 bg-[#070E1A]/95 shadow-[0_20px_60px_rgba(2,6,23,0.35)] md:hidden"
          >
            <div className="space-y-3 px-4 py-6">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block rounded-2xl border border-[#25304d] bg-[#0b1427]/90 px-4 py-3 text-base font-medium text-[#c9bedb] hover:border-[#4C1D95] hover:text-[#F8FAFC]"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="#register"
                onClick={() => setIsOpen(false)}
                className="theme-button theme-button-register mt-4 block rounded-full px-5 py-3 text-center font-semibold"
              >
                Register Now
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
