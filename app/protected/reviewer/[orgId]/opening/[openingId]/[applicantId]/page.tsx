'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function OpeningOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const { orgId, openingId } = params as { orgId: string; openingId: string };

  return (
    <div className="flex-1 w-full flex flex-col gap-6">
      <Button 
        variant="outline" 
        onClick={() => router.push(`/protected/reviewer/${orgId}`)}
        className="w-fit"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>
      
      <h1 className="text-3xl font-bold">Opening Overview</h1>
      <h2 className="text-xl text-muted-foreground">
        This page is the opening overview page for opening "{openingId}" in org "{orgId}" - shows kanban board, etc
      </h2>
    </div>
  );
}
