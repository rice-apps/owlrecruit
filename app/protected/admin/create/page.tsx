"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function CreateOrgPage() {
  const router = useRouter();

  return (
    <div className="flex-1 w-full flex flex-col gap-6">
      <Button variant="outline" onClick={() => router.back()} className="w-fit">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <h1 className="text-3xl font-bold">
        This is the page for creating an org
      </h1>
    </div>
  );
}
