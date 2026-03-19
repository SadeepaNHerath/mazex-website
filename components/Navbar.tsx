"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import { NAV_LINKS } from "@/lib/constants";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#061826]/80 backdrop-blur-md border-b border-[#1B4965]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
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

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[#A9D6E5] hover:text-[#EAF6FF] text-sm transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#register"
              className="bg-[#2C7DA0] text-[#EAF6FF] px-5 py-2 rounded-full text-sm font-semibold hover:shadow-[0_0_20px_rgba(44,125,160,0.5)] transition-all duration-300"
            >
              Register Now
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-[#EAF6FF] p-2"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-[#061826]/95 backdrop-blur-lg border-t border-[#1B4965]/50 overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block text-[#A9D6E5] hover:text-[#EAF6FF] text-lg transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="#register"
                onClick={() => setIsOpen(false)}
                className="block bg-[#2C7DA0] text-[#EAF6FF] px-5 py-3 rounded-full text-center font-semibold mt-4"
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
