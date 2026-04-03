"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { REGISTRATION_OPEN_DATE, COMPETITION_DATE } from "@/lib/constants";
import FlipUnit from "./FlipUnit";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(targetDate: Date, now: number): TimeLeft {
  const diff = targetDate.getTime() - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

interface CountdownProps {
  initialMode?: "registration" | "competition";
  showModeSwitch?: boolean;
  registrationMode?: "countdown" | "comingSoon";
}

export default function Countdown({
  initialMode = "competition",
  showModeSwitch = true,
  registrationMode = "countdown",
}: CountdownProps) {
  const [showCompetition, setShowCompetition] = useState(
    initialMode === "competition"
  );
  const targetDate = showCompetition ? COMPETITION_DATE : REGISTRATION_OPEN_DATE;
  const [now, setNow] = useState(() => Date.now());
  const timeLeft = calculateTimeLeft(targetDate, now);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const units = [
    { value: timeLeft.days, label: "Days" },
    { value: timeLeft.hours, label: "Hours" },
    { value: timeLeft.minutes, label: "Minutes" },
    { value: timeLeft.seconds, label: "Seconds" },
  ];

  return (
    <div>
      {showModeSwitch ? (
        <div className="mb-8 flex justify-center">
          <div className="rounded-full border border-[#303959] bg-[#0B1427]/85 p-1.5 shadow-[0_0.75rem_1.875rem_rgba(2,6,23,0.25)]">
            <div className="flex gap-1">
              <button
                onClick={() => {
                  setShowCompetition(true);
                  setNow(Date.now());
                }}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 cursor-pointer ${
                  showCompetition
                    ? "theme-button text-[#F8FAFC]"
                    : "text-[#c9bedb] hover:text-[#F8FAFC]"
                }`}
              >
                Competition Day
              </button>
              <button
                onClick={() => {
                  setShowCompetition(false);
                  setNow(Date.now());
                }}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 cursor-pointer ${
                  !showCompetition
                    ? "theme-button text-[#F8FAFC]"
                    : "text-[#c9bedb] hover:text-[#F8FAFC]"
                }`}
              >
                Registration Opens
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-8 flex justify-center">
          <span className="inline-flex rounded-full border border-[#303959] bg-[#0B1427]/85 px-6 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-[#c9bedb]">
            Registration Opens
          </span>
        </div>
      )}

      <div className="min-h-[16.25rem] sm:min-h-[13.75rem] flex flex-col justify-center">
        {showCompetition || registrationMode === "countdown" ? (
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
            {units.map((unit, i) => (
              <FlipUnit key={i} value={unit.value} label={unit.label} />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold uppercase tracking-[0.2em] text-[#c9bedb] sm:text-3xl md:text-4xl"
            >
              Coming Soon
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
