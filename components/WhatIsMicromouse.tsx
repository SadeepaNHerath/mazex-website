"use client";

import { motion } from "framer-motion";
import { MICROMOUSE_STATS } from "@/lib/constants";
import MazeAnimation from "./MazeAnimation";

export default function WhatIsMicromouse() {
  return (
    <section id="micromouse" className="theme-section relative py-24 sm:py-32">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#A855F7]/50 to-transparent" />
      <div className="absolute left-[8%] top-12 h-[280px] w-[280px] rounded-full bg-[#818CF8]/10 opacity-40 blur-[110px] pointer-events-none" />
      <div className="absolute right-[5%] bottom-0 h-[320px] w-[320px] rounded-full bg-[#A855F7]/10 opacity-40 blur-[130px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-14 text-center"
        >
          
          <h2 className="text-3xl font-bold text-[#F8FAFC] sm:text-4xl lg:text-5xl">
            What is a Micromouse?
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="maze-card mx-auto w-full max-w-[260px] sm:max-w-[320px] md:max-w-[360px] lg:max-w-[380px] p-2 justify-self-center"
          >
            <div className="maze-card-scan" />
            <div className="relative z-10 flex items-center justify-center bg-[#040811]/95 p-4 sm:p-5 aspect-square">
              <MazeAnimation size={360} className="w-full h-full" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="theme-copy mb-10 text-lg">
              A Micromouse is a small, fully autonomous robot that navigates and
              solves a maze in the shortest possible time with no human
              intervention. It uses sensors to detect walls, processes data using
              onboard microcontrollers, and applies maze-solving algorithms to
              find the optimal path.
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {MICROMOUSE_STATS.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="maze-card border-t-2 border-t-[#818CF8]/20 group"
                >
                  <div className="maze-card-scan" />
                  
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#A855F7] shadow-[0_0_8px_rgba(168,85,247,0.6)] animate-pulse" />
                    <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#A855F7]/80 uppercase">
                      Sensor_S{String(i + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <h3 className="mb-2 text-sm font-bold uppercase tracking-[0.15em] text-[#F8FAFC] group-hover:text-[#A855F7] transition-colors duration-300">
                    {stat.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#94a3b8] group-hover:text-[#cbd5e1] transition-colors duration-300">
                    {stat.description}
                  </p>

                  <div className="absolute top-0 right-0 h-8 w-8 opacity-0 transition-opacity duration-500 group-hover:opacity-40">
                    <div className="absolute top-3 right-3 h-px w-4 bg-[#A855F7]" />
                    <div className="absolute top-3 right-3 h-4 w-px bg-[#A855F7]" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
