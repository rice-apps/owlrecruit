"use client";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import SignUpGoogleBtn from "@/app/auth/sign-up/sign-up-google";


export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sign up</CardTitle>
          <CardDescription></CardDescription>
        </CardHeader>
        <CardContent>
          <SignUpGoogleBtn />
        </CardContent>
      </Card>
    </div>
  );
}
