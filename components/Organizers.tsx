"use client";

import { motion } from "framer-motion";
import { ORGANIZERS } from "@/lib/constants";

export default function Organizers() {
  return (
    <section className="theme-section-alt relative py-24 sm:py-32">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#818CF8]/40 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <span className="theme-kicker mb-5">Command Units</span>
          <h2 className="text-3xl font-bold text-[#F8FAFC] sm:text-4xl lg:text-5xl">
            Organized By
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {ORGANIZERS.map((org, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="theme-card p-8"
            >
              <span className="theme-chip mb-6 text-xs font-semibold uppercase tracking-[0.24em]">
                {org.tag}
              </span>

              <div className="mb-6 flex h-24 items-center justify-center rounded-[1.4rem] border border-[#24304d] bg-[#0B1427]/90">
                <span className="text-sm font-medium text-[#CBD5E1]">
                  {org.tag} Logo
                </span>
              </div>

              {org.href ? (
                <a
                  href={org.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#C084FC]"
                >
                  <h3 className="mb-2 text-xl font-bold text-[#F8FAFC]">
                    {org.title}
                  </h3>
                </a>
              ) : (
                <h3 className="mb-2 text-xl font-bold text-[#F8FAFC]">
                  {org.title}
                </h3>
              )}

              <p className="mb-4 text-sm text-[#C084FC]">{org.subtitle}</p>
              <p className="text-sm leading-relaxed text-[#94A3B8]">
                {org.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
