"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import FlipUnit from "./FlipUnit";
import {
  resolveCompetitionCta,
  type ResolvedCompetitionEvent,
} from "@/lib/site-event-types";

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function calculateTimeLeft(targetDate: string, now: number): TimeLeft {
  const diff = new Date(targetDate).getTime() - now;

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

function CountdownGrid({ targetDate }: { targetDate: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const timeLeft = useMemo(() => calculateTimeLeft(targetDate, now), [targetDate, now]);
  const units = [
    { value: timeLeft.days, label: "Days" },
    { value: timeLeft.hours, label: "Hours" },
    { value: timeLeft.minutes, label: "Minutes" },
    { value: timeLeft.seconds, label: "Seconds" },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
      {units.map((unit) => (
        <FlipUnit key={unit.label} value={unit.value} label={unit.label} />
      ))}
    </div>
  );
}

export default function RegisterCTA({
  competition,
}: {
  competition: ResolvedCompetitionEvent;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!competition.openAt && !competition.closeAt) return;

    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [competition.closeAt, competition.openAt]);

  const { ctaState: liveState, countdownTarget } = useMemo(
    () =>
      resolveCompetitionCta({
        enabled: competition.enabled,
        openAt: competition.openAt,
        closeAt: competition.closeAt,
        registerHref: competition.registerHref,
        now,
      }),
    [
      competition.closeAt,
      competition.enabled,
      competition.openAt,
      competition.registerHref,
      now,
    ],
  );
  const showCountdown = Boolean(countdownTarget);
  const pillText =
    liveState === "countdown"
      ? "Registration Opens In"
      : liveState === "open" && countdownTarget
        ? "Registration Closes In"
        : liveState === "temporarily-closed"
          ? "Registration Temporarily Closed"
        : "Competition Registration";
  const statusText =
    liveState === "open"
      ? "Registration Is Open"
      : liveState === "temporarily-closed"
        ? "Registration Is Temporarily Closed"
      : liveState === "closed"
        ? "Registrations Are Closed"
        : "Coming Soon";

  return (
    <section
      id="register"
      className="theme-section-alt relative overflow-hidden py-12 sm:py-16"
    >
      <div
        className="absolute top-1/2 left-1/2 h-[760px] w-[760px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(129, 140, 248, 0.025) 0%, transparent 42%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <motion.div
           initial={{ opacity: 0, y: 40 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 0.6 }}
           className="maze-card mx-auto max-w-5xl px-4 py-16 sm:px-10 sm:py-36 !bg-[#07050d]/95"
        >
          <div className="maze-card-scan" />
          
          <h2 className="mt-6 mb-4 text-4xl font-bold text-[#F8FAFC] sm:mt-12 sm:text-5xl lg:text-6xl">
            Ready to Build Your Micromouse?
          </h2>

          <div className="mt-12 relative z-10 flex flex-col items-center justify-center">
            <span className="theme-kicker">
              <div className="animate-kicker-scan" />
              {pillText}
            </span>

            <div className="my-6 h-px w-24 bg-gradient-to-r from-transparent via-[#818CF8]/50 to-transparent" />

            <div className="w-full max-w-4xl">
              {showCountdown ? (
                <CountdownGrid targetDate={countdownTarget!} />
              ) : (
                <div className="py-4 text-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="bg-gradient-to-r from-[#F8FAFC] via-[#CBD5E1] to-[#818CF8] bg-clip-text font-[family-name:var(--font-space-grotesk)] text-2xl font-extrabold uppercase tracking-[0.3em] text-transparent drop-shadow-[0_0_15px_rgba(129,140,248,0.25)] sm:text-3xl md:text-4xl"
                  >
                    {statusText}
                  </motion.div>
                </div>
              )}
            </div>

            {competition.scheduleLabel ? (
              <p className="mt-6 mb-6 max-w-2xl text-sm leading-relaxed text-[#c9bedb] sm:mb-12">
                {competition.scheduleLabel}
              </p>
            ) : null}

            {liveState === "open" && competition.registerHref ? (
              <a
                href={competition.registerHref}
                className="theme-button theme-button-register mt-4 mb-6 inline-flex rounded-full px-8 py-3 text-sm font-medium sm:mb-12"
              >
                Register Now
              </a>
            ) : null}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
