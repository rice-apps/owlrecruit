interface Interview {
  id: string;
  notes: string;
  application_id: string;
  starttime: string | null;
  endtime: string | null;
}

interface InterviewsSectionProps {
  interviews: Interview[];
}

export default function InterviewsSection({ interviews }: InterviewsSectionProps) {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Interviews ({interviews.length})
        </h3>
      </div>
      
      {interviews.length > 0 ? (
        <div className="space-y-4">
          {interviews.map((interview, index) => (
            <div key={interview.id || `interview-${index}`} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
              <div className="space-y-3">
                <div className="space-y-2">
                  {interview.starttime && (
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {new Date(interview.starttime).toLocaleDateString()}
                    </div>
                  )}
                </div>
                {interview.starttime && interview.endtime && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Time
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {new Date(interview.starttime).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })} - {new Date(interview.endtime).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                )}
                {!interview.starttime && !interview.endtime && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Time
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                      Not scheduled
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Notes
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{interview.notes}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="text-2xl mb-2">📅</div>
          <p className="text-sm">No interviews scheduled</p>
        </div>
      )}
    </div>
  );
}