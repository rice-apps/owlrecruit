'use client';

import {useEffect, useState, use} from 'react';
import ApplicantInfo from './components/ApplicantInfo';
import ApplicationResponses from './components/ApplicationResponses';
import InterviewsSection from './components/InterviewsSection';
import Review from './components/Review';

interface ApplicationPageProps {
  params: Promise<{
    applicationId: string;
  }>;
}

interface User {
  id: string;
  name: string;
  net_id: string;
  email: string;
}

interface Interview {
  id: string;
  notes: string;
  application_id: string;
  starttime: string | null;
  endtime: string | null;
}

interface Application {
  id: string;
  org_id: string;
  applicant_id: string;
  position: string;
  status: string;
  form_responses: any | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface ApplicationReview {
  id: string;
  application_id: string;
  reviewer_id: string;
  notes: string | null;
  score: 'strong yes' | 'yes' | 'maybe' | 'no' | 'strong no' | 'No Rating';
  created_at: string;
  updated_at: string;
}

interface OrgInfo {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface ApplicationData {
  "application": Application;
  "application review": ApplicationReview;
  "organization": OrgInfo;
}

export default function ApplicationPage({ params }: ApplicationPageProps) {
  const { applicationId } = use(params);

  // state for fetched data
  const [applicationData, setApplicationData] = useState<ApplicationData | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch application data
        const applicationResponse = await fetch(`/api/applications/${applicationId}`);
        if (!applicationResponse.ok) {
          throw new Error('Failed to fetch application data');
        }
        const applicationData: ApplicationData = await applicationResponse.json();

        // Fetch interviews data
        const interviewsResponse = await fetch(`/api/interviews/${applicationId}`);
        if (!interviewsResponse.ok) {
          throw new Error('Failed to fetch interviews data');
        }
        const interviewsData: Interview[] = await interviewsResponse.json();

        // Fetch user data 
        const userResponse = await fetch(`/api/user/${applicationData["application"].applicant_id}`);
        if (!userResponse.ok) {
          throw new Error('Failed to fetch user data');
        }
        const userDataArray: User[] = await userResponse.json();

        // DEBUG
        // console.log("Fetched user data:", userDataArray);
        // console.log("Fetched application data:", applicationData);
        // console.log("Fetched interviews data:", interviewsData);

        // Extract the first user from the array
        const userData = userDataArray[0];
        if (!userData) {
          throw new Error('No user data found');
        }

        setApplicationData(applicationData);
        setInterviews(interviewsData);
        setUser(userData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [applicationId]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading application data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 mb-2">❌ {error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Application Overview
          </h2>
        </div>
        
        {/* Applicant Info Component */}
        {user && <ApplicantInfo user={user} />}
        
        {/* Application Responses Component */}
        {applicationData && <ApplicationResponses application={applicationData["application"]} orgInfo={applicationData["organization"]} />}
        
        {/* Interviews Section Component */}
        <InterviewsSection interviews={interviews} />
        
        {/* Review Component */}
        {applicationData && <Review review={applicationData["application review"]} />}
      </div>
    </div>
  );
}