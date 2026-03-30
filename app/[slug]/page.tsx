import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PublicRegistrationForm from "@/components/registration/PublicRegistrationForm";
import {
  getFormAvailability,
  getFormBannerUrl,
  getRegistrationFormBySlug,
} from "@/lib/registrations";
import { RESERVED_SLUGS } from "@/lib/registration-types";

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

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Banner */}
      {bannerUrl && (
        <div className="relative h-64 w-full overflow-hidden sm:h-80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bannerUrl}
            alt={form.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-8 sm:px-8">
            <div className="mx-auto max-w-3xl">
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] ${
                  availability.state === "open"
                    ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-200"
                    : availability.state === "closed"
                      ? "border-rose-500/40 bg-rose-500/20 text-rose-200"
                      : "border-amber-500/40 bg-amber-500/20 text-amber-200"
                }`}
              >
                {availability.label}
              </span>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {form.title}
              </h1>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {!bannerUrl && (
          <div className="mb-8">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] ${
                availability.state === "open"
                  ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-200"
                  : availability.state === "closed"
                    ? "border-rose-500/40 bg-rose-500/20 text-rose-200"
                    : "border-amber-500/40 bg-amber-500/20 text-amber-200"
              }`}
            >
              {availability.label}
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl">
              {form.title}
            </h1>
            {form.description && (
              <p className="mt-3 text-base leading-7 text-slate-300">
                {form.description}
              </p>
            )}
            {availability.description && (
              <p className="mt-2 text-sm text-slate-400">{availability.description}</p>
            )}
          </div>
        )}

        {bannerUrl && (form.description || availability.description) && (
          <div className="mb-8">
            {form.description && (
              <p className="text-base leading-7 text-slate-300">{form.description}</p>
            )}
            {availability.description && (
              <p className="mt-2 text-sm text-slate-400">{availability.description}</p>
            )}
          </div>
        )}

        <PublicRegistrationForm
          form={form}
          availability={availability}
          slug={slug}
        />
      </div>
    </div>
  );
}
