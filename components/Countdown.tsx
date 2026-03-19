"use client";

import { useState, useEffect, useCallback } from "react";
import { REGISTRATION_OPEN_DATE, COMPETITION_DATE } from "@/lib/constants";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(targetDate: Date): TimeLeft {
  const now = new Date().getTime();
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

export default function Countdown() {
  const [showCompetition, setShowCompetition] = useState(false);
  const targetDate = showCompetition ? COMPETITION_DATE : REGISTRATION_OPEN_DATE;
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft(targetDate));

  const updateTime = useCallback(() => {
    setTimeLeft(calculateTimeLeft(targetDate));
  }, [targetDate]);

  useEffect(() => {
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [updateTime]);

  const units = [
    { value: timeLeft.days, label: "Days" },
    { value: timeLeft.hours, label: "Hours" },
    { value: timeLeft.minutes, label: "Minutes" },
    { value: timeLeft.seconds, label: "Seconds" },
  ];

  return (
    <div>
      {/* Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-[#1B4965]/60 p-1 rounded-full flex gap-1 border border-[#2C7DA0]/30">
          <button
            onClick={() => setShowCompetition(false)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 cursor-pointer ${
              !showCompetition
                ? "bg-[#2C7DA0] text-[#EAF6FF] shadow-[0_0_15px_rgba(44,125,160,0.4)]"
                : "text-[#61A5C2] hover:text-[#A9D6E5]"
            }`}
          >
            Registration Opens
          </button>
          <button
            onClick={() => setShowCompetition(true)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 cursor-pointer ${
              showCompetition
                ? "bg-[#2C7DA0] text-[#EAF6FF] shadow-[0_0_15px_rgba(44,125,160,0.4)]"
                : "text-[#61A5C2] hover:text-[#A9D6E5]"
            }`}
          >
            Competition Day
          </button>
        </div>
      </div>

      {/* Timer */}
      <div className="flex justify-center gap-3 sm:gap-6">
        {units.map((unit, i) => (
          <div
            key={i}
            className="bg-[#1B4965]/60 backdrop-blur-sm border border-[#2C7DA0]/30 rounded-xl p-4 sm:p-6 min-w-[70px] sm:min-w-[90px] text-center"
          >
            <div 
              className="text-3xl sm:text-5xl font-bold text-[#EAF6FF] font-[family-name:var(--font-space-grotesk)] tabular-nums"
              suppressHydrationWarning
            >
              {String(unit.value).padStart(2, "0")}
            </div>
            <div className="text-[#61A5C2] text-xs sm:text-sm mt-1 uppercase tracking-wider">
              {unit.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
