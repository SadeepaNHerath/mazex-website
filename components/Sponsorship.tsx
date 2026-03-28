"use client";

import { motion } from "framer-motion";
import { SPONSOR_TIERS } from "@/lib/constants";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Sponsorship() {
  return (
    <section id="sponsors" className="theme-section relative py-24 sm:py-32">
      <div className="absolute left-[4%] top-[12%] h-[260px] w-[260px] rounded-full bg-[#A855F7]/8 opacity-40 blur-[110px] pointer-events-none" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <span className="theme-kicker mb-5">Partnership Grid</span>
          <h2 className="mb-4 text-3xl font-bold text-[#F8FAFC] sm:text-4xl lg:text-5xl">
            Partner With Us
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-[#9e8db3]">
            Join us in shaping the next generation of robotics engineers
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {SPONSOR_TIERS.map((tier, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className="theme-card flex flex-col p-6"
            >
              <div
                className="absolute left-0 right-[35%] top-0 h-[2px]"
                style={{ background: `linear-gradient(90deg, ${tier.color}, transparent)` }}
              />

              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#2D374F] bg-[#111A31]/90 text-2xl">
                  {tier.icon}
                </span>
                <h3 className="text-lg font-bold" style={{ color: tier.color }}>
                  {tier.tier}
                </h3>
              </div>

              <span
                className="mb-5 inline-flex self-start rounded-full px-3 py-1 text-xs font-semibold"
                style={{
                  backgroundColor: `${tier.color}18`,
                  color: tier.color,
                  border: `1px solid ${tier.color}40`,
                }}
              >
                {tier.amount}
              </span>

              <ul className="mb-6 flex-1 space-y-2">
                {tier.perks.map((perk, j) => (
                  <li
                    key={j}
                    className="flex items-start gap-2 text-sm text-[#9e8db3]"
                  >
                    <span
                      className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: tier.color }}
                    />
                    {perk}
                  </li>
                ))}
              </ul>

              <button
                className="theme-button-secondary w-full rounded-xl py-2 text-sm font-medium"
                style={{
                  borderColor: `${tier.color}45`,
                  color: tier.color,
                }}
              >
                Learn More
              </button>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="theme-card mt-16 p-8 text-center sm:p-12"
        >
          <h3 className="mb-3 text-2xl font-bold text-[#F8FAFC]">
            Interested in partnering? Let&apos;s talk.
          </h3>
          <p className="mx-auto mb-6 max-w-lg text-[#9e8db3]">
            Help us make MazeX 1.0 a landmark event for robotics education at
            the University of Moratuwa.
          </p>
          <a
            href="mailto:contact@mazex.lk"
            className="theme-button inline-block rounded-full px-8 py-3 font-semibold"
          >
            Contact Us
          </a>
        </motion.div>
      </div>
    </section>
  );
}
