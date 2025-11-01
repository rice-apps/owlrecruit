interface User {
  id: string;
  name: string;
  net_id: string;
  email: string;
}

interface ApplicantInfoProps {
  user: User;
}

export default function ApplicantInfo({ user }: ApplicantInfoProps) {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Applicant Information
        </h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Full Name
          </label>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {user.name}
          </p>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            NetID
          </label>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {user.net_id}
          </p>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Email Address
          </label>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {user.email}
          </p>
        </div>
      </div>
    </div>
  );
}