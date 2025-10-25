import { AuthButton } from "@/components/auth-button";
import { Hero } from "@/components/hero";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"}>OwlRecruit</Link>
            </div>
            <AuthButton />
          </div>
        </nav>
        {/* Hero Section of the landing page. Include a call to action */}
        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5">
          <Hero />
          
        </div>

        {/* Description Section */}
        <div className="flex-1 flex flex-col gap-4 max-w-5xl p-5">
          <p className="text-3xl lg:text-3xl !leading-tight mx-auto max-w-xl text-center">
            The smarter way to connect students with clubs:
          </p>
          <p className="text-3xl lg:text-2xl !leading-tight mx-auto max-w-xl text-center">
            OwlRecuit brings club recruiting into the modern age. Browse open applications, 
            track your submissions, and manage reviews—all in one place! No more lost emails, 
            missed deadlines, or endless spreadsheets. Whether you're finding your community 
            or building it, OwlRecruit makes it effortless.
          </p>
        </div>

        {/* Contact Section*/}
        <div className="flex-1 flex flex-col gap-4 max-w-5xl p-5">
          <p className="text-3xl lg:text-4xl !leading-tight mx-auto max-w-xl text-center">
            Contacts:
          </p>
        </div>
        
       {/* FAQ Section*/}
        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5">
          <p className="text-3xl lg:text-4xl !leading-tight mx-auto max-w-xl text-center">
            FAQ
          </p>
        </div>



        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <p>
            Built by {" "}
            <a
              href="https://riceapps.org/"
              target="_blank"
              className="font-bold hover:underline"
              rel="noreferrer"
            >
              RiceApps
            </a>
          </p>
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}
