"use client";

import { motion } from "framer-motion";
import Image from "next/image";
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
          <h2 className="text-3xl font-bold text-[#F8FAFC] sm:text-4xl lg:text-5xl">
            Organized By
          </h2>
        </motion.div>

        <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6 lg:gap-8">
          {ORGANIZERS.map((org, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="w-full flex-1"
            >
              <a
                href={org.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex h-24 w-full items-center justify-center overflow-hidden rounded-xl border border-maze-border/20 bg-white p-3 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(168,85,247,0.15)] sm:h-28 md:h-32"
              >
                <div className="relative h-full w-full">
                  <Image
                    src={(org as any).logo}
                    alt={org.title}
                    fill
                    className="object-contain transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
