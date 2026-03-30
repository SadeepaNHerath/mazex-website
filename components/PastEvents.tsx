"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PAST_EVENTS } from "@/lib/constants";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function PastEvents() {
  const [selectedEventIndex, setSelectedEventIndex] = useState<number | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const mounted = typeof document !== "undefined";

  useEffect(() => {
    if (selectedEventIndex !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedEventIndex]);

  const selectedEvent = selectedEventIndex !== null ? PAST_EVENTS[selectedEventIndex] : null;

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
          <h2 className="text-3xl font-bold text-[#F8FAFC] sm:text-4xl lg:text-5xl">
            What We&apos;ve Done Before
          </h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 gap-6 md:grid-cols-3"
        >
          {PAST_EVENTS.map((event, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              whileHover="hover"
              onClick={() => {
                setSelectedEventIndex(i);
                setActiveImageIndex(0);
              }}
              className="group relative h-[320px] cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-[#161B22]"
            >
              {/* Background Image */}
              <div className="absolute inset-0 z-0">
                <img
                  src={event.images[0]}
                  alt={event.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
              </div>

              {/* Content Overlay */}
              <div className="absolute inset-x-0 bottom-0 z-10 p-6 pt-16">
                <div className="absolute inset-0 z-[-1] bg-gradient-to-t from-black/95 via-black/80 to-transparent transition-opacity duration-300 group-hover:opacity-100" />
                
                <h3 className="mb-2 text-xl font-bold tracking-tight text-white transition-transform duration-300 group-hover:-translate-y-1">
                  {event.title}
                </h3>
                
                <motion.div
                  initial={{ opacity: 0, y: 10, height: 0 }}
                  variants={{
                    hover: { 
                      opacity: 1, 
                      y: 0,
                      height: "auto",
                      transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] }
                    }
                  }}
                  className="overflow-hidden"
                >
                  <p className="text-sm leading-relaxed text-gray-300/90">
                    {event.description}
                  </p>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Gallery Modal - Using Portal */}
      {mounted && createPortal(
        <AnimatePresence>
          {selectedEvent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/98 p-4 backdrop-blur-md sm:p-8"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedEventIndex(null)}
                className="absolute top-6 right-6 z-[10000] rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
              >
                <X size={24} />
              </button>

              {/* Main Image View */}
              <div className="relative flex h-full max-h-[75vh] w-full max-w-6xl items-center justify-center pt-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : selectedEvent.images.length - 1));
                  }}
                  className="absolute left-0 z-[10000] rounded-full bg-white/5 p-3 text-white transition-all hover:bg-white/10 hover:scale-110 md:-left-20"
                >
                  <ChevronLeft size={36} />
                </button>

                <motion.div 
                  key={activeImageIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="aspect-video w-full overflow-hidden rounded-2xl shadow-2xl shadow-black/50"
                >
                  <img
                    src={selectedEvent.images[activeImageIndex]}
                    alt={`${selectedEvent.title} - ${activeImageIndex + 1}`}
                    className="h-full w-full object-cover"
                  />
                </motion.div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex((prev) => (prev < selectedEvent.images.length - 1 ? prev + 1 : 0));
                  }}
                  className="absolute right-0 z-[10000] rounded-full bg-white/5 p-3 text-white transition-all hover:bg-white/10 hover:scale-110 md:-right-20"
                >
                  <ChevronRight size={36} />
                </button>
              </div>

              {/* Info & Thumbnails */}
              <div className="mt-10 flex w-full max-w-5xl flex-col items-center gap-8">
                <div className="text-center">
                  <h3 className="text-3xl font-bold text-white mb-2 tracking-tight">{selectedEvent.title}</h3>
                  <p className="max-w-3xl text-sm leading-relaxed text-gray-400">{selectedEvent.description}</p>
                </div>

                {/* Thumbnails */}
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar max-w-full px-4">
                  {selectedEvent.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative h-20 w-32 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                        activeImageIndex === idx 
                          ? "border-blue-500 scale-110 shadow-lg shadow-blue-500/20" 
                          : "border-transparent opacity-40 hover:opacity-100 hover:scale-105"
                      }`}
                    >
                      <img src={img} className="h-full w-full object-cover" alt="" />
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Click outside to close */}
              <div 
                className="absolute inset-0 z-[-1] cursor-zoom-out" 
                onClick={() => setSelectedEventIndex(null)} 
              />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </section>
  );
}
