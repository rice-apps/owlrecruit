import { useEffect, useState } from 'react';

interface ApplicationReview {
  id: string;
  application_id: string;
  reviewer_id: string;
  notes: string | null;
  score: 'strong yes' | 'yes' | 'maybe' | 'no' | 'strong no' | 'No Rating';
  created_at: string;
  updated_at: string;
}

interface User {
  id: string;
  name: string;
  net_id: string;
  email: string;
}

interface ReviewsProps {
  review: ApplicationReview | null;
}

export default function Review({ review }: ReviewsProps) {
  const [reviewer, setReviewer] = useState<User | null>(null);

  useEffect(() => {
    if (!review || !review.reviewer_id) {
      return;
    }

    const fetchReviewer = async () => {
      try {
        const userResponse = await fetch(`/api/user/${review.reviewer_id}`);
        if (userResponse.ok) {
          const userDataArray: User[] = await userResponse.json();
          const userData = userDataArray[0];
          if (userData) {
            setReviewer(userData);
          }
        }
      } catch (err) {
        console.error('Error fetching reviewer:', err);
      }
    };

    fetchReviewer();
  }, [review]);

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Review
        </h3>
      </div>

      {!review ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">No application reviews yet</p>
        </div>
      ) : (
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            {reviewer && (
              <div>
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Reviewed by
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {reviewer.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {reviewer.net_id}
                </div>
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Score
            </div>
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {review.score}
            </div>
          </div>
        </div>
        
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Reviewer Notes
          </label>
          <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded border">
            <p className="text-sm text-gray-900 dark:text-gray-100">
              {review.notes || "No notes provided"}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 dark:text-gray-400">
          <div>
            <span className="font-medium">Created:</span> {new Date(review.created_at).toLocaleDateString()}
          </div>
          <div>
            <span className="font-medium">Updated:</span> {new Date(review.updated_at).toLocaleDateString()}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}