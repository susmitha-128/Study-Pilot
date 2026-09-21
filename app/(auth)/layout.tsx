import { SiteHeader } from "@/components/site-header";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink bg-grid-fade text-white">
      <SiteHeader />
      <div className="mx-auto flex max-w-md flex-col justify-center px-6 py-16">{children}</div>
    </div>
  );
}
