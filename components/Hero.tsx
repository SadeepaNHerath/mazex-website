"use client";

import { motion } from "framer-motion";
import HexBackground from "./HexBackground";
import MazeAnimation from "./MazeAnimation";

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden pt-20 pb-12"
    >
      <HexBackground opacity={0.05} />

      {/* Primary radial glow — right side */}
      <div
        className="absolute top-1/3 right-[10%] w-[700px] h-[700px] -translate-y-1/2 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(27, 73, 101, 0.45) 0%, transparent 70%)",
        }}
      />

      {/* Secondary glow — left/bottom */}
      <div
        className="absolute bottom-0 left-[5%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(44, 125, 160, 0.15) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left — Text Content */}
          <div>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-block mb-6"
            >
              <span className="bg-[#1B4965]/80 text-[#61A5C2] border border-[#2C7DA0]/60 px-5 py-2 rounded-full text-sm font-medium tracking-wide backdrop-blur-sm">
                IEEE RAS × WIE | University of Moratuwa
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[96px] font-bold uppercase gradient-text leading-[1.05] mb-3 tracking-tight"
            >
              MazeX 1.0
            </motion.h1>

            {/* Subtitle */}
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl md:text-2xl text-[#A9D6E5] mb-5 font-[family-name:var(--font-space-grotesk)] font-semibold"
            >
              Micromouse Workshop Series &amp; Competition
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-[#A9D6E5]/75 text-sm sm:text-base md:text-lg max-w-xl mb-8 leading-relaxed"
            >
              Build. Program. Solve. An intra-university robotics competition
              where you design an autonomous maze-solving robot and race against
              the best minds at Moratuwa.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap gap-4 mb-8"
            >
              <a
                href="#register"
                id="hero-register-btn"
                className="group relative bg-[#2C7DA0] text-[#EAF6FF] px-8 py-3.5 rounded-full font-semibold text-base transition-all duration-300 hover:shadow-[0_0_40px_rgba(44,125,160,0.6)] hover:scale-[1.03] active:scale-[0.98]"
              >
                <span className="relative z-10">Register Now</span>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#2C7DA0] to-[#61A5C2] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </a>
              <a
                href="#delegates"
                id="hero-learn-btn"
                className="border border-[#61A5C2]/60 text-[#61A5C2] px-8 py-3.5 rounded-full font-semibold hover:bg-[#61A5C2]/10 hover:border-[#61A5C2] transition-all duration-300 text-base"
              >
                Delegate Book
              </a>
            </motion.div>
          </div>

          {/* Right — Maze Animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.4, ease: "easeOut" }}
            className="hidden md:flex justify-center items-center"
          >
            <div className="relative">
              {/* Outer glow ring */}
              <div
                className="absolute -inset-8 rounded-3xl pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle at center, rgba(44, 125, 160, 0.1) 0%, transparent 70%)",
                }}
              />
              <MazeAnimation size={380} className="animate-float" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade to section divider */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#061826] to-transparent pointer-events-none z-20" />
    </section>
  );
}
