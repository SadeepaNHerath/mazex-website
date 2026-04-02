import { FaWhatsapp } from "react-icons/fa";

const whatsappLink = "https://whatsapp.com/channel/0029Vb7eiSyDTkJwKt2PQT2W";

export default function WhatsAppButton() {
  return (
    <a
      href={whatsappLink}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with MazeX on WhatsApp"
      className="fixed right-5 bottom-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-[#380d4f] text-white shadow-[0_16px_32px_rgba(56,13,79,0.35)] transition hover:-translate-y-1 hover:scale-105 hover:bg-[#4a1467] focus:outline-none focus:ring-2 focus:ring-white/70 focus:ring-offset-2 focus:ring-offset-[#020104] sm:right-7 sm:bottom-7"
    >
      <FaWhatsapp className="h-7 w-7" aria-hidden="true" />
    </a>
  );
}
