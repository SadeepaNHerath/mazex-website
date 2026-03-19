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
    hoverGlow: "hover:shadow-[0_0_20px_rgba(24,119,242,0.6)]",
  },
  {
    icon: FaLinkedinIn,
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/ieeeuomsb/",
    bg: "bg-[#0A66C2]",
    hoverGlow: "hover:shadow-[0_0_20px_rgba(10,102,194,0.6)]",
  },
  {
    icon: FaYoutube,
    label: "YouTube",
    href: "https://www.youtube.com/@IEEEUOMSB",
    bg: "bg-[#FF0000]",
    hoverGlow: "hover:shadow-[0_0_20px_rgba(255,0,0,0.5)]",
  },
  {
    icon: FaInstagram,
    label: "Instagram",
    href: "https://www.instagram.com/ieeesbuom",
    bg: "bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]",
    hoverGlow: "hover:shadow-[0_0_20px_rgba(221,42,123,0.6)]",
  },
  {
    icon: FaWhatsapp,
    label: "WhatsApp",
    href: "https://whatsapp.com/channel/0029VawdYwuFnSzHnM7b8J30",
    bg: "bg-[#25D366]",
    hoverGlow: "hover:shadow-[0_0_20px_rgba(37,211,102,0.5)]",
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
    <footer className="relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#2C7DA0]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-[#61A5C2]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* ═══════ TOP: 4-Column Footer ═══════ */}
      <div className="bg-[#030F18] border-t border-[#1B4965]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-8">
            {/* Col 1: Brand */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-1"
            >
              <div className="mb-6 flex items-center">
                <Image
                  src="/images/logo-white.svg"
                  alt="MazeX Logo"
                  width={140}
                  height={78}
                  className="h-12 w-auto object-contain"
                />
              </div>
              <p className="text-[#A9D6E5]/70 text-sm leading-relaxed mb-6">
                Micromouse Workshop Series &amp; Competition organized by IEEE
                RAS and WIE at the University of Moratuwa.
              </p>
              <a
                href="mailto:ieeerassbm@gmail.com"
                className="inline-flex items-center gap-2 text-[#61A5C2] hover:text-[#A9D6E5] text-sm transition-colors duration-200"
              >
                <HiOutlineMail size={16} />
                ieeerassbm@gmail.com
              </a>
            </motion.div>

            {/* Col 2: Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h4 className="text-[#EAF6FF] font-bold text-sm uppercase tracking-wider mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#2C7DA0]" />
                Quick Links
              </h4>
              <ul className="space-y-3">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-[#A9D6E5]/70 hover:text-[#EAF6FF] text-sm transition-colors duration-200 hover:translate-x-1 inline-block transform"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Col 3: Organized By */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h4 className="text-[#EAF6FF] font-bold text-sm uppercase tracking-wider mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#61A5C2]" />
                Organized By
              </h4>
              <ul className="space-y-3 text-[#A9D6E5]/70 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-[#2C7DA0] mt-1 text-base">▸</span>
                  <a href="https://site.ieee.org/sb-moratuwa/" target="_blank" rel="noopener noreferrer" className="hover:text-[#EAF6FF] transition-colors duration-200">
                    University of Moratuwa IEEE Student Branch
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2C7DA0] mt-1 text-base">▸</span>
                  <a href="https://site.ieee.org/sb-moratuwa/chapters/robotics-and-automation-society/" target="_blank" rel="noopener noreferrer" className="hover:text-[#EAF6FF] transition-colors duration-200">
                    IEEE Robotics &amp; Automation Society Chapter
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2C7DA0] mt-1 text-base">▸</span>
                  <a href="https://site.ieee.org/sb-moratuwa/chapters/women-in-engineering/" target="_blank" rel="noopener noreferrer" className="hover:text-[#EAF6FF] transition-colors duration-200">
                    IEEE WIE Affinity Group
                  </a>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ═══════ MIDDLE: Organizer Logos Showcase ═══════ */}
      <div className="bg-[#020B12] border-t border-[#1B4965]/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-col items-center gap-10"
          >
            {/* IEEE SB capsule — logo + text + social icons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center gap-6"
            >
              <a
                href="https://site.ieee.org/sb-moratuwa/"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-[#2C7DA0]/30 to-[#61A5C2]/30 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-white rounded-full p-3 w-[72px] h-[72px] flex items-center justify-center shadow-lg shadow-black/20 transition-transform duration-300 group-hover:scale-105">
                  <Image
                    src="/images/IEEE SB.webp"
                    alt="University of Moratuwa IEEE Student Branch"
                    width={52}
                    height={52}
                    className="object-contain"
                  />
                </div>
              </a>
              <div className="text-center sm:text-left">
                <p className="text-[#EAF6FF] font-bold text-base sm:text-lg font-[family-name:var(--font-space-grotesk)] leading-tight">
                  University of Moratuwa
                </p>
                <p className="text-[#61A5C2] font-medium text-sm">
                  IEEE Student Branch
                </p>
              </div>
              <div className="flex items-center gap-4 sm:ml-8 flex-wrap mt-4 sm:mt-0">
                {SOCIAL_LINKS.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={`showcase-${social.label}`}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${social.bg} flex items-center justify-center text-white transition-all duration-300 ${social.hoverGlow} hover:-translate-y-1 hover:scale-110 shadow-lg`}
                    >
                      <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                    </a>
                  );
                })}
              </div>
            </motion.div>

            {/* Thin divider */}
            <div className="w-full max-w-xl h-px bg-gradient-to-r from-transparent via-[#2C7DA0]/30 to-transparent" />

            {/* IEEE RAS & WIE — wide landscape logo cards */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-10 w-full max-w-3xl"
            >
              {/* IEEE RAS */}
              <a
                href="https://site.ieee.org/sb-moratuwa/chapters/robotics-and-automation-society/"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex-1 w-full block"
              >
                <div className="absolute -inset-2 bg-gradient-to-r from-[#2C7DA0]/20 to-[#61A5C2]/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-white rounded-2xl px-8 py-5 shadow-lg shadow-black/20 transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-xl group-hover:shadow-[#2C7DA0]/10 flex items-center justify-center">
                  <Image
                    src="/images/IEEE RAS.webp"
                    alt="IEEE Robotics and Automation Society — University of Moratuwa"
                    width={360}
                    height={90}
                    className="object-contain max-h-[60px] w-full"
                  />
                </div>
              </a>

              {/* Vertical divider */}
              <div className="hidden sm:block w-px h-16 bg-gradient-to-b from-transparent via-[#2C7DA0]/30 to-transparent flex-shrink-0" />

              {/* IEEE WIE */}
              <a
                href="https://site.ieee.org/sb-moratuwa/chapters/women-in-engineering/"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex-1 w-full block"
              >
                <div className="absolute -inset-2 bg-gradient-to-r from-[#61A5C2]/20 to-[#A9D6E5]/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-white rounded-2xl px-8 py-5 shadow-lg shadow-black/20 transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-xl group-hover:shadow-[#61A5C2]/10 flex items-center justify-center">
                  <Image
                    src="/images/IEEE WIE.webp"
                    alt="IEEE Women in Engineering — University of Moratuwa"
                    width={360}
                    height={90}
                    className="object-contain max-h-[60px] w-full"
                  />
                </div>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* ═══════ BOTTOM: White Copyright Bar ═══════ */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <p className="text-[#0D2233] font-semibold text-sm text-center">
            IEEE Student Branch, University of Moratuwa
          </p>
          <p className="text-[#0D2233]/60 text-xs text-center mt-1">
            © 2026 MazeX 1.0 – All rights reserved.
          </p>
        </div>
      </motion.div>
    </footer>
  );
}
