import { Hero } from "@/components/hero";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 w-full flex flex-col items-center">
      <div className="w-full flex flex-col gap-20 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"}>OwlRecruit</Link>
            </div>
          </div>
        </nav>

        {/* Hero Section - full width */}
        <Hero />

        {/* Centered content section */}
        <div className="flex-1 w-full flex flex-col gap-20 items-center" />
      </div>
    </main>
  );
}