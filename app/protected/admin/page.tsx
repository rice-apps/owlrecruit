'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Building } from 'lucide-react';
import Link from 'next/link';

// mock data
const mockAdminOrgs = [
  {
    org_id: '111zb32233',
    org_name: 'Club 1',
  },
  {
    org_id: '2342ab354', 
    org_name: 'Club 2',
  },
  {
    org_id: '52352an1',
    org_name: 'Club 3',
  }
];

export default function AdminPage() {
  const router = useRouter();

  return (
    <div className="flex-1 w-screen max-w-5xl flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="w-fit"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <Button asChild>
          <Link href="/protected/create">
            <Plus className="w-4 h-4 mr-2" />
            Create Organization
          </Link>
        </Button>
      </div>
      
      <div>
        <h1 className="text-3xl font-bold mb-2">Organization Management</h1>
        <p className="text-muted-foreground mb-6">
          Organizations you have administrative access to
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockAdminOrgs.map((org) => (
          <Card 
            key={org.org_id} 
            className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50"
            onClick={() => router.push(`/protected/admin/${org.org_id}`)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">{org.org_name}</CardTitle>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
