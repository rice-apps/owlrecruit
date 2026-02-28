import SignUpGoogleBtn from "@/app/auth/sign-up/sign-up-google";

export default function SignInPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-5xl font-bold tracking-tight">
          Welcome to OwlRecruit.
        </h1>
        <p className="text-lg text-gray-500">
          Rice University&apos;s club recruitment platform
        </p>
        <div className="mt-4 w-80">
          <SignUpGoogleBtn />
        </div>
      </div>
    </main>
  );
}
