"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface FlipUnitProps {
  value: number;
  label: string;
}

export default function FlipUnit({ value, label }: FlipUnitProps) {
  const displayValue = String(value).padStart(2, "0");

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-1 sm:gap-2">
        {displayValue.split("").map((digit, idx) => (
          <Digit key={idx} digit={digit} />
        ))}
      </div>
      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-maze-muted-strong sm:text-xs">
        {label}
      </span>
    </div>
  );
}

function Digit({ digit }: { digit: string }) {
  const [prevDigit, setPrevDigit] = useState(digit);

  useEffect(() => {
    if (digit !== prevDigit) {
      const timer = setTimeout(() => {
        setPrevDigit(digit);
      }, 600); // Wait for animation to finish
      return () => clearTimeout(timer);
    }
  }, [digit, prevDigit]);

  return (
    <div className="relative h-20 w-14 sm:h-28 sm:w-20 [perspective:1000px] font-sans">
      {/* Static Background Cards */}
      <div className="absolute inset-0 flex flex-col">
        {/* Top Half (New Value) */}
        <div className="relative h-1/2 w-full overflow-hidden rounded-t-md border-x border-t border-[#CBD5E1]/40 bg-[#F1F5F9]">
          <div 
            className="absolute inset-x-0 top-0 flex h-[200%] items-center justify-center text-5xl font-black tracking-tighter text-[#1E293B] sm:text-7xl"
            suppressHydrationWarning
          >
            {digit}
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/10 to-transparent" />
        </div>
        {/* Bottom Half (Old Value) */}
        <div className="relative h-1/2 w-full overflow-hidden rounded-b-md border-x border-b border-[#CBD5E1]/40 bg-[#F1F5F9] shadow-lg">
          <div 
            className="absolute inset-x-0 bottom-0 flex h-[200%] items-center justify-center text-5xl font-black tracking-tighter text-[#1E293B] sm:text-7xl"
            suppressHydrationWarning
          >
            {prevDigit}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/10 to-transparent" />
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {digit !== prevDigit && (
          <div className="absolute inset-0 flex flex-col z-10">
            {/* Flipping Top (Old Value) */}
            <motion.div
              initial={{ rotateX: 0 }}
              animate={{ rotateX: -90 }}
              transition={{ duration: 0.3, ease: "easeIn" }}
              style={{ transformOrigin: "bottom", backfaceVisibility: "hidden" }}
              className="relative h-1/2 w-full overflow-hidden rounded-t-md border-x border-t border-[#CBD5E1]/40 bg-[#F1F5F9]"
            >
              <div 
                className="absolute inset-x-0 top-0 flex h-[200%] items-center justify-center text-5xl font-black tracking-tighter text-[#1E293B] sm:text-7xl"
                suppressHydrationWarning
              >
                {prevDigit}
              </div>
              {/* Shadow effect during flip */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 bg-[#000]/20" 
              />
            </motion.div>

            {/* Flipping Bottom (New Value) */}
            <motion.div
              initial={{ rotateX: 90 }}
              animate={{ rotateX: 0 }}
              transition={{ duration: 0.3, delay: 0.3, ease: "easeOut" }}
              style={{ transformOrigin: "top", backfaceVisibility: "hidden" }}
              className="relative h-1/2 w-full overflow-hidden rounded-b-md border-x border-b border-[#CBD5E1]/40 bg-[#F1F5F9]"
            >
              <div 
                className="absolute inset-x-0 bottom-0 flex h-[200%] items-center justify-center text-5xl font-black tracking-tighter text-[#1E293B] sm:text-7xl"
                suppressHydrationWarning
              >
                {digit}
              </div>
              {/* Highlight effect during flip */}
              <motion.div 
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="absolute inset-0 bg-[#000]/20" 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Center hinge line - Even thicker and darker */}
      <div className="absolute top-1/2 left-0 w-full h-[3px] bg-[#94A3B8]/30 z-30 shadow-[0_0_8px_rgba(0,0,0,0.1)]" />
    </div>
  );
}
