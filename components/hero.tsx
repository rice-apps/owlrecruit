import SignUpGoogleBtn from "@/app/auth/sign-up/sign-up-google";
import { Button } from "./ui/button";

export function Hero() {
  return (
    <section className="w-full">
      <div className="flex">
        <div className="max-w-5xl mx-auto p-10 py-20">
          <h1 className="sr-only">OwlRecruit</h1>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-left">
            OwlRecruit
          </h2>
          <p className="text-xl lg:text-2xl font-semibold mb-4 text-left">
            The smarter way to connect students with clubs
          </p>
          <p className="text-lg mb-8 text-left max-w-4xl">
            OwlRecruit brings club recruiting into the modern age. Browse open
            applications, track your submissions, and manage reviews—all in one
            place! No more lost emails, missed deadlines, or endless
            spreadsheets. Whether you're finding your community or building it,
            OwlRecruit makes it effortless.
          </p>
          <div className="w-1/4 center">
            <SignUpGoogleBtn />
          </div>
        </div>
      </div>
    </section>
  );
}
