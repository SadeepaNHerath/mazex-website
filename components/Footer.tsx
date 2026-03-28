"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { NAV_LINKS } from "@/lib/constants";
import {
  FaFacebookF,
  FaLinkedinIn,
  FaYoutube,
  FaInstagram,
  FaWhatsapp,
} from "react-icons/fa";
import { HiOutlineMail } from "react-icons/hi";

const SOCIAL_LINKS = [
  {
    icon: FaFacebookF,
    label: "Facebook",
    href: "https://www.facebook.com/IEEEUOMSB",
    bg: "bg-[#1877F2]",
  },
  {
    icon: FaLinkedinIn,
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/ieeeuomsb/",
    bg: "bg-[#0A66C2]",
  },
  {
    icon: FaYoutube,
    label: "YouTube",
    href: "https://www.youtube.com/@IEEEUOMSB",
    bg: "bg-[#FF0000]",
  },
  {
    icon: FaInstagram,
    label: "Instagram",
    href: "https://www.instagram.com/ieeesbuom",
    bg: "bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]",
  },
  {
    icon: FaWhatsapp,
    label: "WhatsApp",
    href: "https://whatsapp.com/channel/0029VawdYwuFnSzHnM7b8J30",
    bg: "bg-[#25D366]",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export default function Footer() {
  return (
    <footer className="theme-section relative overflow-hidden pb-8">
      <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-[#A855F7]/6 opacity-40 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 h-80 w-80 rounded-full bg-[#818CF8]/6 opacity-40 blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="theme-card p-8 sm:p-10">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="mb-6 flex items-center">
                <Image
                  src="/images/brand/logo-white.svg"
                  alt="MazeX Logo"
                  width={140}
                  height={78}
                  className="h-12 w-auto object-contain"
                />
              </div>
              <p className="mb-6 text-sm leading-relaxed text-[#94A3B8]">
                Micromouse Workshop Series &amp; Competition organized by IEEE
                RAS and WIE at the University of Moratuwa.
              </p>
              <a
                href="mailto:ieeerassbm@gmail.com"
                className="inline-flex items-center gap-2 text-sm text-[#CBD5E1] hover:text-[#F8FAFC]"
              >
                <HiOutlineMail size={16} />
                ieeerassbm@gmail.com
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h4 className="mb-6 text-sm font-bold uppercase tracking-[0.28em] text-[#C084FC]">
                Quick Links
              </h4>
              <ul className="space-y-3">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm text-[#94A3B8] hover:text-[#F8FAFC]"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h4 className="mb-6 text-sm font-bold uppercase tracking-[0.28em] text-[#818CF8]">
                Organized By
              </h4>
              <ul className="space-y-3 text-sm text-[#94A3B8]">
                <li>
                  <a href="https://site.ieee.org/sb-moratuwa/" target="_blank" rel="noopener noreferrer" className="hover:text-[#F8FAFC]">
                    University of Moratuwa IEEE Student Branch
                  </a>
                </li>
                <li>
                  <a href="https://site.ieee.org/sb-moratuwa/chapters/robotics-and-automation-society/" target="_blank" rel="noopener noreferrer" className="hover:text-[#F8FAFC]">
                    IEEE Robotics &amp; Automation Society Chapter
                  </a>
                </li>
                <li>
                  <a href="https://site.ieee.org/sb-moratuwa/chapters/women-in-engineering/" target="_blank" rel="noopener noreferrer" className="hover:text-[#F8FAFC]">
                    IEEE WIE Affinity Group
                  </a>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>

        <div className="theme-card mt-6 px-6 py-10 sm:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-col items-center gap-10"
          >
            <motion.div
              variants={itemVariants}
              className="flex flex-col items-center gap-6 sm:flex-row"
            >
              <a
                href="https://site.ieee.org/sb-moratuwa/"
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white p-3 shadow-lg shadow-black/20">
                  <Image
                    src="/images/logos/IEEE SB.webp"
                    alt="University of Moratuwa IEEE Student Branch"
                    width={52}
                    height={52}
                    className="object-contain"
                  />
                </div>
              </a>
              <div className="text-center sm:text-left">
                <p className="text-base font-bold leading-tight text-[#F8FAFC] sm:text-lg">
                  University of Moratuwa
                </p>
                <p className="text-sm font-medium text-[#C084FC]">
                  IEEE Student Branch
                </p>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-4 sm:mt-0 sm:ml-8">
                {SOCIAL_LINKS.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={`showcase-${social.label}`}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:scale-110 ${social.bg}`}
                    >
                      <Icon className="h-6 w-6" />
                    </a>
                  );
                })}
              </div>
            </motion.div>

            <div className="h-px w-full max-w-xl bg-gradient-to-r from-transparent via-[#A855F7]/30 to-transparent" />

            <motion.div
              variants={itemVariants}
              className="flex w-full max-w-3xl flex-col items-center justify-center gap-8 sm:flex-row sm:gap-10"
            >
              <a
                href="https://site.ieee.org/sb-moratuwa/chapters/robotics-and-automation-society/"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full flex-1"
              >
                <div className="flex items-center justify-center rounded-2xl bg-white px-8 py-5 shadow-lg shadow-black/20 transition-transform duration-300 hover:scale-[1.03]">
                  <Image
                    src="/images/logos/IEEE RAS.webp"
                    alt="IEEE Robotics and Automation Society â€” University of Moratuwa"
                    width={360}
                    height={90}
                    className="max-h-[60px] w-full object-contain"
                  />
                </div>
              </a>

              <div className="hidden h-16 w-px bg-gradient-to-b from-transparent via-[#A855F7]/30 to-transparent sm:block" />

              <a
                href="https://site.ieee.org/sb-moratuwa/chapters/women-in-engineering/"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full flex-1"
              >
                <div className="flex items-center justify-center rounded-2xl bg-white px-8 py-5 shadow-lg shadow-black/20 transition-transform duration-300 hover:scale-[1.03]">
                  <Image
                    src="/images/logos/IEEE WIE.webp"
                    alt="IEEE Women in Engineering â€” University of Moratuwa"
                    width={360}
                    height={90}
                    className="max-h-[60px] w-full object-contain"
                  />
                </div>
              </a>
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 rounded-[1.4rem] border border-[#24304d] bg-[#070E1A]/92 px-6 py-5"
        >
          <p className="text-center text-sm font-semibold text-[#CBD5E1]">
            IEEE Student Branch, University of Moratuwa
          </p>
          <p className="mt-1 text-center text-xs text-[#94A3B8]">
            Â© 2026 MazeX 1.0 â€“ All rights reserved.
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
