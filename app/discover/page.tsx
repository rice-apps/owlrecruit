import { DiscoverFeed } from "@/components/discover-feed";
import Link from "next/link";

export default function PublicDiscoverPage() {
  return (
    <div className="min-h-screen flex flex-col">
       {/* Simple header for public view */}
       <header className="border-b bg-white">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
           <Link href="/" className="flex items-center gap-2">
             <div className="relative w-8 h-8">
                {/* Same logo placeholder as sidebar */}
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full text-cyan-500"
                >
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z"
                    fill="currentColor"
                    opacity="0.2"
                  />
                  <path
                    d="M12 16C14 16 15.5 15 16.5 13.5"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
             </div>
             <span className="font-bold text-xl text-cyan-500 tracking-tight">
               owlrecruit
             </span>
           </Link>
           <div className="flex gap-4">
              <Link href="/auth/signin" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                 Log in
              </Link>
           </div>
         </div>
       </header>
       
       <main className="flex-1 bg-gray-50">
          <DiscoverFeed />
       </main>
    </div>
  );
}
