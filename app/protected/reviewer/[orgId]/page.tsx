'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function ReviewerOrgPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.orgId as string;

  return (
    <div className="flex-1 w-full flex flex-col gap-6">
      <Button 
        variant="outline" 
        onClick={() => router.push('/protected/reviewer')}
        className="w-fit"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>
      
      <h1 className="text-3xl font-bold">Review Applications</h1>
      <h2 className="text-xl text-muted-foreground">
        This page shows all openings for org "{orgId}" for reviewers
      </h2>
    </div>
  );
}
