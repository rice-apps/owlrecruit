import { Button } from "./ui/button";

export function Hero() {
  return (
    <div className="flex flex-col gap-16 items-center">
      <h1 className="sr-only">Supabase and Next.js Starter Template</h1>
      <p className="text-3xl lg:text-4xl !leading-tight mx-auto max-w-xl text-center">
        Welcome to OwlRecruit!
      </p>
      <p className="text-3xl lg:text-4xl !leading-tight mx-auto max-w-xl text-center">
        Rice University's club application portal. 
      </p>
      <Button>
        Browse Campus Opportunities
      </Button>


    </div>
  );
}
