import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Application } from "../columns";

interface ApplicationCardProps {
  application: Application;
}

export function ApplicationCard({ application }: ApplicationCardProps) {
  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "accepted":
        return "success";
      case "rejected":
        return "destructive";
      case "under review":
        return "secondary";
      case "interviewing":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{application.name}</h3>
          </div>
          <Badge variant={getStatusVariant(application.status)}>
            {application.status}
          </Badge>
        </div>
      </CardHeader>
    </Card>
  );
}
