interface ApplicationNotesProps {
  notes: string;
}

export default function ApplicationNotes({ notes }: ApplicationNotesProps) {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Application Notes
        </h3>
      </div>
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
        <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
          {notes}
        </p>
      </div>
    </div>
  );
}
