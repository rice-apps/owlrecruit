'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Building } from 'lucide-react';

export default function ReviewerPage() {
  const router = useRouter();

  return (
    <div className="flex-1 w-screen max-w-5xl flex flex-col gap-6">
      <Button 
        variant="outline" 
        onClick={() => router.back()}
        className="w-fit"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>
      
      <div>
        <h1 className="text-3xl font-bold mb-2">Review Applications</h1>
        <p className="text-muted-foreground mb-6">
          Organizations where you can review applications
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 text-center py-12">
          <Building className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Organizations Will Appear Here</h3>
        </CardContent>
      </Card>
    </div>
  );
}
