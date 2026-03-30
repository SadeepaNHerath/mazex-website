import { redirect } from "next/navigation";

// The old /register/[slug] route has moved to /[slug].
// Redirect any traffic that lands here.
export default async function OldRegisterRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/${slug}`);
}
