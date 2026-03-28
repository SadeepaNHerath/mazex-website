"use client";

import { motion } from "framer-motion";
import { PAST_EVENTS } from "@/lib/constants";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function PastEvents() {
  return (
    <section className="theme-section-alt relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <span className="theme-kicker mb-5">Previous Routes</span>
          <h2 className="text-3xl font-bold text-[#F8FAFC] sm:text-4xl lg:text-5xl">
            What We&apos;ve Done Before
          </h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 gap-6 overflow-x-auto md:grid-cols-3"
        >
          {PAST_EVENTS.map((event, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className="theme-card flex min-w-[280px] flex-col p-6"
            >
              <div className="mb-5 flex items-center justify-between gap-3">
                <span className="theme-chip text-[11px] font-semibold uppercase tracking-[0.24em]">
                  Event {String(i + 1).padStart(2, "0")}
                </span>
                <div className="theme-track h-8 w-20" />
              </div>

              <h3 className="mb-3 text-xl font-bold text-[#F8FAFC]">
                {event.title}
              </h3>
              <p className="flex-1 text-sm leading-relaxed text-[#9e8db3]">
                {event.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
