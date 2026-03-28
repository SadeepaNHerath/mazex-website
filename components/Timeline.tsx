"use client";

import { motion } from "framer-motion";
import { TIMELINE_EVENTS } from "@/lib/constants";

export default function Timeline() {
  return (
    <section id="timeline" className="theme-section-alt relative py-24 sm:py-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-bold gradient-text mb-16 text-center"
        >
          Event Timeline
        </motion.h2>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-[#2C7DA0]/50 md:-translate-x-px" />

          {TIMELINE_EVENTS.map((event, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className={`relative flex items-center mb-12 last:mb-0 ${
                i % 2 === 0
                  ? "md:flex-row"
                  : "md:flex-row-reverse"
              }`}
            >
              {/* Number circle */}
              <div className="absolute left-6 md:left-1/2 -translate-x-1/2 z-10">
                <div className="w-12 h-12 rounded-full bg-[#2C7DA0] flex items-center justify-center font-bold text-[#EAF6FF] text-sm shadow-[0_0_20px_rgba(44,125,160,0.5)]">
                  {event.number}
                </div>
              </div>

              {/* Card */}
              <div
                className={`ml-20 md:ml-0 md:w-[calc(50%-40px)] ${
                  i % 2 === 0 ? "md:pr-8 md:text-right" : "md:pl-8"
                }`}
              >
                <div className="bg-[#1B4965]/60 backdrop-blur-sm border border-[#2C7DA0]/40 rounded-xl p-6 hover:shadow-[0_0_20px_rgba(44,125,160,0.2)] transition-all duration-300">
                  <h3 className="text-[#EAF6FF] font-bold text-lg mb-1">
                    {event.title}
                  </h3>
                  <p className="text-[#A9D6E5] text-sm">{event.date}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
