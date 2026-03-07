import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Application, Opening, Org } from "@/types/app";

// Define the type here or import it if we add it to types/app.ts
export interface ApplicationWithDetails extends Application {
  opening: Pick<Opening, "title" | "closes_at"> & {
    org: Pick<Org, "name">;
  };
}

interface ApplicationCardProps {
  application: ApplicationWithDetails;
}

export function ApplicationCard({ application }: ApplicationCardProps) {
  const { opening, status } = application;
  const { org } = opening;

  // Determine badge color/variant based on status if needed
  // For now using default or secondary

  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
      <CardHeader className="p-4 pb-2 space-y-2">
        {/* Logo Placeholder - random color or just org initial */}
        <div className="w-12 h-12 rounded-lg bg-pink-600 flex items-center justify-center text-white font-bold text-xl mb-1">
          {org.name.charAt(0)}
        </div>

        <div>
          <h3 className="font-bold text-lg leading-tight">{opening.title}</h3>
          <p className="text-sm text-gray-500">{org.name}</p>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow">
        <Badge variant="secondary" className="mt-2 text-xs font-normal">
          {status || "Pending"}
        </Badge>
      </CardContent>
      <CardFooter className="p-4 border-t text-xs text-gray-400 flex justify-between items-center">
        <span>
          {opening.closes_at
            ? `Due ${new Date(opening.closes_at).toLocaleDateString("en-US", {
                month: "2-digit",
                day: "2-digit",
                year: "numeric",
              })}`
            : "No deadline"}
        </span>
      </CardFooter>
    </Card>
  );
}
