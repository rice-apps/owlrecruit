'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Users } from 'lucide-react';
import React from 'react';

interface ClubPageProps {
  params: Promise<{ orgId: string }>;
}

export default function ClubPage({ params }: ClubPageProps) {
  const router = useRouter();
  const { orgId } = React.use(params);

  return (
    <div className="flex-1 w-screen max-w-5xl flex flex-col gap-6">
      <Button 
        variant="outline" 
        onClick={() => router.push('/protected/discover')}
        className="w-fit"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Clubs
      </Button>
      
      <div>
        <h1 className="text-3xl font-bold mb-2">{orgId}</h1>
        <p className="text-muted-foreground mb-6">
          Club details and information
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">About this club</h2>
          </div>
          <p className="text-muted-foreground">
            Details for {orgId} will be displayed here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}