"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const TEAM_MEMBERS = [
  {
    name: "Chanuru Dewnitha",
    role: "Chair",
    phone: "0788119064",
    email: "chaniruranawaka@gmail.com",
    image: "/images/team/Chair_DP.jpeg",
  },
  {
    name: "Rashmika Wellappili",
    role: "Vice Chair",
    phone: "0706270500",
    email: "rashmikarw@gmail.com",
    image: "/images/team/Vice_Chair3_DP.jpeg",
  },
  {
    name: "Sarjana Shanmugarajah",
    role: "Vice Chair",
    phone: "0750744233",
    email: "sar03jana@gmail.com",
    image: "/images/team/Vice_Chair1_DP.jpeg",
  },
  {
    name: "Raneesha Fernando",
    role: "Vice Chair",
    phone: "0779811166",
    email: "raneesha0925@gmail.com",
    image: "/images/team/Vice_Chair2_DP.jpeg",
  },
  {
    name: "Sasindu Wellage",
    role: "Finance Committee Lead",
    phone: "0769389061",
    email: "wellagesasindu@gmail.com",
    image: "/images/team/Finance_committee_lead_DP.jpeg",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export default function ContactUs() {
  const topRow = TEAM_MEMBERS.slice(0, 3);
  const bottomRow = TEAM_MEMBERS.slice(3);

  const renderCard = (member: (typeof TEAM_MEMBERS)[number]) => (
    <motion.div
      key={member.email}
      variants={cardVariants}
      className="group relative w-full"
    >
      <div className="absolute -inset-[1px] rounded-[1.6rem] bg-gradient-to-b from-[#A855F7]/30 to-[#818CF8]/16 opacity-0 blur-[2px] transition-opacity duration-500 group-hover:opacity-100" />

      <div className="theme-card relative flex flex-col items-center px-6 py-10 transition-all duration-500 group-hover:-translate-y-2">
        <div className="relative mb-6">
          <div className="absolute -inset-1.5 rounded-full bg-gradient-to-br from-[#A855F7] to-[#818CF8] opacity-55 blur-[4px]" />
          <div className="relative h-32 w-32 overflow-hidden rounded-full ring-[3px] ring-[#2D374F] transition-all duration-500 group-hover:ring-[#A855F7]/70">
            <Image
              src={member.image}
              alt={member.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </div>
        </div>

        <h3 className="mb-2 text-center text-xl font-bold tracking-tight text-[#F8FAFC]">
          {member.name}
        </h3>

        <span className="mb-6 inline-flex rounded-full border border-[#3E2570] bg-[#1C1635] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-[#C084FC]">
          {member.role}
        </span>

        <div className="mb-6 h-px w-16 bg-gradient-to-r from-transparent via-[#A855F7]/50 to-transparent" />

        <a
          href={`tel:${member.phone}`}
          className="mb-2 text-base font-medium tracking-wide text-[#c9bedb] hover:text-[#F8FAFC]"
        >
          {member.phone}
        </a>

        <a
          href={`mailto:${member.email}`}
          className="text-sm tracking-wide text-[#9e8db3] hover:text-[#F8FAFC]"
        >
          {member.email}
        </a>
      </div>
    </motion.div>
  );

  return (
    <section id="contact" className="theme-section-alt relative overflow-hidden py-20 lg:py-28">
      <div className="absolute top-20 left-1/4 h-[500px] w-[500px] rounded-full bg-[#A855F7]/8 opacity-40 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 h-[400px] w-[400px] rounded-full bg-[#818CF8]/8 opacity-40 blur-[120px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <span className="theme-kicker mb-5">Get In Touch</span>
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl">
            <span className="text-[#F8FAFC]">Contact </span>
            <span className="gradient-text">Us</span>
          </h2>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-[#9e8db3] sm:text-lg">
            Have questions about MazeX 1.0? Reach out to our organizing
            committee.
          </p>
          <div className="mt-6 mx-auto h-1 w-24 rounded-full bg-gradient-to-r from-[#A855F7] to-[#818CF8]" />
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mb-8 lg:grid-cols-3 lg:gap-8"
        >
          {topRow.map(renderCard)}
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="flex flex-col justify-center gap-6 sm:flex-row lg:gap-8"
        >
          {bottomRow.map((member) => (
            <div
              key={member.email}
              className="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1.33rem)]"
            >
              {renderCard(member)}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
