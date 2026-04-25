"use client";

import { useEffect, useState } from "react";
import type { EligibleReviewer } from "@/components/opening-form/types";

interface OrgSummary {
  id: string;
  name: string;
}

export function useOpeningFormContext(orgId: string) {
  const [orgName, setOrgName] = useState<string>("");
  const [eligibleReviewers, setEligibleReviewers] = useState<
    EligibleReviewer[]
  >([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [orgsRes, reviewersRes] = await Promise.all([
          fetch("/api/orgs"),
          fetch(`/api/org/${orgId}/members?role=admin,reviewer`),
        ]);

        if (orgsRes.ok) {
          const orgs = (await orgsRes.json()) as OrgSummary[];
          const org = orgs.find((candidate) => candidate.id === orgId);
          if (org) setOrgName(org.name);
        }

        if (reviewersRes.ok) {
          const json = await reviewersRes.json();
          const reviewerData = (json.data ?? json) as EligibleReviewer[];
          setEligibleReviewers(Array.isArray(reviewerData) ? reviewerData : []);
        }
      } catch (error) {
        console.error("Error fetching opening form context:", error);
      }
    };

    fetchData();
  }, [orgId]);

  return { orgName, eligibleReviewers };
}
