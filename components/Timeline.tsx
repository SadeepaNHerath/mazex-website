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
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[#A855F7]/50 to-[#818CF8]/20 md:-translate-x-px" />

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
                <div className="w-12 h-12 rounded-full border-[2.5px] border-[#A855F7] bg-[#1C1635] flex items-center justify-center font-bold text-[#F8FAFC] text-sm shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                  {event.number}
                </div>
              </div>

              {/* Card */}
              <div
                className={`ml-20 md:ml-0 md:w-[calc(50%-40px)] ${
                  i % 2 === 0 ? "md:pr-8 md:text-right" : "md:pl-8"
                }`}
              >
                <div className="bg-[#0e0a14]/95 backdrop-blur-[24px] border border-[#1a1624] rounded-xl p-6 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] hover:border-[#2f2540] transition-all duration-300 group">
                  <h3 className="text-[#F8FAFC] font-bold text-lg mb-1 group-hover:bg-gradient-to-r group-hover:from-[#F8FAFC] group-hover:to-[#A855F7] group-hover:bg-clip-text group-hover:text-transparent">
                    {event.title}
                  </h3>
                  <p className="text-[#9e8db3] text-sm font-semibold tracking-wide uppercase">{event.date}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
