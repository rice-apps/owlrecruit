import { get } from "http";

interface ResumeProps {
  resumeUrl: string | null;
}

export default function Resume({ resumeUrl }: ResumeProps) {
  // Convert Google Drive view URL to preview/embed URL
  const getEmbedUrl = (url: string | null): string | null => {
    if (!url) return null;

    try {
      return url.replace('/view', '/preview');
    } catch (err) {
      console.error('Error parsing resume URL:', err);
      return null;
    }``
  };

  const embedUrl = getEmbedUrl(resumeUrl);

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Resume
        </h3>
      </div>

      {!embedUrl ? (
        <div className="text-center py-8">
          <div className="text-2xl mb-2">📄</div>
          <p className="text-sm text-gray-500 dark:text-gray-400">No resume available</p>
        </div>
      ) : (
        <div className="w-full" style={{ height: '600px' }}>
          <iframe
            src={embedUrl}
            className="w-full h-full rounded border border-gray-200 dark:border-gray-600"
            title="Resume PDF Viewer"
            allow="autoplay"
          />
        </div>
      )}
    </div>
  );
}
