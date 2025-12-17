"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  User,
  Mail,
  Clock,
  AlertCircle,
  Loader2,
  Building,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface ClubData {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

interface ApplicationData {
  id: string;
  applicant_id: string;
  org_id: string;
  status: string;
  position: string;
  created_at: string;
  updated_at: string;
  notes?: string;
}

interface InterviewerData {
  id: string;
  name: string;
  email: string;
}

interface PageData {
  club: ClubData | null;
  application: ApplicationData | null;
  interviewers: InterviewerData[];
  user: any;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const LoadingState = () => (
  <div className="flex-1 w-full flex flex-col gap-8">
    <div className="h-4 w-32 bg-muted rounded animate-pulse" />
    <div className="h-8 bg-muted rounded animate-pulse w-64" />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[1, 2].map((i) => (
        <Card key={i}>
          <CardHeader>
            <div className="h-6 bg-muted rounded animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

const formatStatus = (status: string) =>
  status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ");

const getStatusVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case "pending":
      return "secondary";
    case "rejected":
      return "destructive";
    default:
      return "default";
  }
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export default function ClubDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clubId = params?.clubId as string;

  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!clubId) {
      setError("No club ID provided");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push("/auth/login");
        return;
      }

      const { data: club, error: clubError } = await supabase
        .from("orgs")
        .select("id, name, description, created_at")
        .eq("id", clubId)
        .single();

      if (clubError || !club) {
        router.push("/protected/dashboard");
        return;
      }

      const { data: application, error: appError } = await supabase
        .from("applications")
        .select("*")
        .eq("applicant_id", user.id)
        .eq("org_id", clubId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!application) {
        router.push("/protected/dashboard");
        return;
      }

      let interviewers: InterviewerData[] = [];
      const { data: reviewsData } = await supabase
        .from("application_reviews")
        .select("reviewer_id")
        .eq("application_id", application.id);

      if (reviewsData && reviewsData.length > 0) {
        const reviewerIds = [
          ...new Set(reviewsData.map((review) => review.reviewer_id)),
        ];
        const { data: interviewersData } = await supabase
          .from("users")
          .select("id, name, email")
          .in("id", reviewerIds);

        if (interviewersData) {
          interviewers = interviewersData;
        }
      }

      setData({
        club,
        application,
        interviewers,
        user,
      });
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [clubId]);

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <div className="flex-1 w-full flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <Link
            href="/protected/dashboard"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error Loading Application
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data?.club || !data?.application) {
    return (
      <div className="flex-1 w-full flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <Link
            href="/protected/dashboard"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Application Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              No application found for this club. You may not have applied yet
              or the application may have been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { club, application, interviewers } = data;

  return (
    <motion.div
      className="flex-1 w-full flex flex-col gap-8"
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
    >
      <div className="flex items-center gap-4">
        <Link
          href="/protected/dashboard"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>
      </div>

      <div className="flex flex-col gap-2 items-start">
        <h1 className="font-bold text-3xl">{club.name}</h1>
        <p className="text-muted-foreground">Application Status</p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Application Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Status:</span>
                <Badge variant={getStatusVariant(application.status)}>
                  {formatStatus(application.status)}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Position:</span>
                  <span className="font-medium">{application.position}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Applied:</span>
                  <span>{formatDate(application.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span>{formatDate(application.updated_at)}</span>
                </div>
              </div>

              {application.notes && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Notes:</h4>
                  <p className="text-sm text-muted-foreground">
                    {application.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Interviewer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {interviewers.length > 0 ? (
                <div className="space-y-4">
                  {interviewers.map((interviewer, index) => (
                    <div
                      key={interviewer.id}
                      className={index > 0 ? "pt-4 border-t" : ""}
                    >
                      <p className="font-medium">{interviewer.name}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`mailto:${interviewer.email}`}
                          className="text-sm hover:underline"
                        >
                          {interviewer.email}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium">
                    Awaiting Interview Assignment
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {club.description && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                About {club.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{club.description}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  );
}
