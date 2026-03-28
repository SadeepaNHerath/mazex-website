"use client";

import { motion } from "framer-motion";
import { HERO_STATS } from "@/lib/constants";
import MazeAnimation from "./MazeAnimation";

export default function Hero() {
  return (
    <section
      id="hero"
      className="theme-section relative flex min-h-screen items-center overflow-hidden pt-20 pb-16 sm:pt-24"
    >
      <div
        className="absolute top-[15%] right-[6%] h-[640px] w-[640px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(168, 85, 247, 0.04) 0%, transparent 48%)",
        }}
      />
      <div
        className="absolute bottom-[-12%] left-[2%] h-[460px] w-[460px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(129, 140, 248, 0.03) 0%, transparent 50%)",
        }}
      />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 inline-block"
            >
              <span className="theme-kicker">IEEE RAS x WIE | University of Moratuwa</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-4 text-5xl font-bold uppercase leading-[0.98] tracking-tight text-[#F8FAFC] sm:text-6xl md:text-7xl lg:text-8xl xl:text-[96px]"
            >
              <span className="block text-[#F8FAFC]">MazeX</span>
              <span className="gradient-text animate-shimmer block">1.0</span>
            </motion.h1>

            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-5 text-lg font-semibold text-[#c9bedb] sm:text-xl md:text-2xl"
            >
              Micromouse Workshop Series &amp; Competition
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="theme-copy mb-9 max-w-2xl text-sm sm:text-base md:text-lg"
            >
              Build. Program. Solve. An intra-university robotics competition
              where you design an autonomous maze-solving robot and race against
              the best minds at Moratuwa.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mb-10 flex flex-wrap gap-4"
            >
              <a
                href="#register"
                id="hero-register-btn"
                className="theme-button theme-button-register rounded-full px-8 py-3.5 text-base font-semibold"
              >
                Register Now
              </a>
              <a
                href="#delegates"
                id="hero-learn-btn"
                className="theme-button-secondary rounded-full px-8 py-3.5 text-base font-semibold"
              >
                Delegate Book
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="grid gap-4 sm:grid-cols-3"
            >
              {HERO_STATS.map((stat) => (
                <div key={stat.label} className="theme-card-soft p-4 sm:p-5">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-[#352F55] bg-[#1C1635] text-2xl shadow-[0_0_18px_rgba(168,85,247,0.18)]">
                    {stat.icon}
                  </div>
                  <p className="text-sm font-medium text-[#E2E8F0]">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.4, ease: "easeOut" }}
            className="flex items-center justify-center"
          >
            <div className="theme-card w-full max-w-[580px] p-5 sm:p-7 lg:p-8">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.32em] text-[#C084FC]">
                    Autonomous Pathfinding
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-[#F8FAFC] sm:text-3xl">
                    Maze Control Deck
                  </h3>
                </div>
                <div className="theme-track h-10 w-28" />
              </div>

              <div className="flex items-center justify-center border border-[#24304d] bg-[#070E1A]/92 p-5 sm:p-6 lg:p-8">
                <MazeAnimation size={360} className="animate-float mx-auto" />
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="theme-card-soft p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#A855F7]">
                    Workshop Mode
                  </p>
                  <p className="mt-2 text-sm text-[#c9bedb]">
                    Learn the build path step by step before competition day.
                  </p>
                </div>
                <div className="theme-card-soft p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#818CF8]">
                    Live Mapping
                  </p>
                  <p className="mt-2 text-sm text-[#c9bedb]">
                    Sensors, control, and search come together in real time.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#040712] to-transparent pointer-events-none z-20" />
    </section>
  );
}
