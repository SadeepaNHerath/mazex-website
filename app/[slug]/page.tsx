import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PublicRegistrationForm from "@/components/registration/PublicRegistrationForm";
import HexBackground from "@/components/HexBackground";
import {
  getFormAvailability,
  getFormBannerUrl,
  getRegistrationFormBySlug,
} from "@/lib/registrations";
import { RESERVED_SLUGS } from "@/lib/registration-types";
import { getResolvedSiteEvents } from "@/lib/site-events";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (RESERVED_SLUGS.has(slug)) return {};

  const form = await getRegistrationFormBySlug(slug);
  if (!form) return {};

  return {
    title: `${form.title} | MazeX`,
    description: form.description ?? `Register for ${form.title}`,
  };
}

export default async function SlugPage({ params }: PageProps) {
  const { slug } = await params;

  // Hard-stop on reserved paths so they continue to their own Next.js routes.
  if (RESERVED_SLUGS.has(slug)) {
    notFound();
  }

  const form = await getRegistrationFormBySlug(slug);
  if (!form) notFound();

  const availability = getFormAvailability(form);
  const bannerUrl = form.bannerFileId ? getFormBannerUrl(form.bannerFileId) : null;
  const siteEvents = await getResolvedSiteEvents();

  return (
    <>
      <Navbar registerHref={siteEvents.competition.navbarHref} />
      <main className="site-shell min-h-screen">
        <div aria-hidden="true" className="site-background">
          <div className="site-background-glow site-background-glow-primary" />
          <div className="site-background-glow site-background-glow-secondary" />
          <div className="site-background-glow site-background-glow-tertiary" />
          <HexBackground opacity={0.3} />
        </div>

        <div className="relative z-10 mx-auto max-w-2xl px-4 pt-24 pb-12 sm:px-6 sm:pt-32 sm:pb-20 lg:pt-36 lg:pb-24">
          {bannerUrl && (
            <div className="mb-8 w-full overflow-hidden rounded-[1.5rem] border border-white/[0.08] shadow-2xl sm:mb-12">
              <div className="relative aspect-[3/1] w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={bannerUrl}
                  alt={form.title}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          )}

          <div className="relative overflow-hidden rounded-[1.5rem] border border-white/[0.08] bg-[#09090b]/80 shadow-2xl backdrop-blur-2xl ring-1 ring-white/5">
            <div className="p-6 sm:p-8 md:p-10">
              <div className="mb-8">
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-widest backdrop-blur-md ${
                    availability.state === "open"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : availability.state === "closed"
                        ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                  }`}
                >
                  {availability.label}
                </span>
                <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  {form.title}
                </h1>

                {form.description && (
                  <p className="mt-4 text-[0.9375rem] leading-relaxed text-slate-300">
                    {form.description}
                  </p>
                )}
                {availability.description && (
                  <p className="mt-4 text-[0.8125rem] font-medium text-slate-400">
                    {availability.description}
                  </p>
                )}
              </div>

              <div className="mt-8 border-t border-white/[0.06] pt-8">
                <PublicRegistrationForm
                  form={form}
                  availability={availability}
                  slug={slug}
                />
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    </>
  );
}
