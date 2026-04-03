"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function SubmissionDrawer({
  onCloseHref,
  children,
}: {
  onCloseHref: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsOpen(true);
  }, []);

  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsOpen(false);
    // The AnimatePresence will handle the exit animation, 
    // but we need to push the route after a short delay
    // to let the exit animation complete. 300ms matches motion duration.
    setTimeout(() => {
      router.push(onCloseHref, { scroll: false });
    }, 300);
  };

  // Do not render on SSR to avoid hydration mismatch with portal
  if (!mounted) return null;

  const portalRoot = document.getElementById("admin-drawer-portal");
  if (!portalRoot) return null;

  const drawerContent = (
    <AnimatePresence>
      {isOpen && (
        <div key="drawer-wrap" className="absolute inset-0 z-50 pointer-events-none">
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-40 bg-zinc-900/40 backdrop-blur-sm dark:bg-zinc-900/60 pointer-events-auto"
            onClick={handleClose}
            aria-label="Close drawer"
          />

          {/* Drawer Container */}
          <motion.div
            key="drawer"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute bottom-0 w-full z-[60] pointer-events-auto bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 rounded-t-2xl shadow-[0_-1.25rem_2.5rem_-1.25rem_rgba(0,0,0,0.1)] flex flex-col h-[95vh] max-h-[95vh] overflow-hidden"
            onClick={(e: React.MouseEvent<HTMLDivElement>) => {
              // Intercept clicks on links that act as the close button inside the children
              const target = e.target as HTMLElement;
              const link = target.closest("a");
              if (link && link.getAttribute("aria-label") === "Close") {
                handleClose(e);
              }
            }}
          >
            <div className="overflow-y-auto w-full">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(drawerContent, portalRoot);
}
