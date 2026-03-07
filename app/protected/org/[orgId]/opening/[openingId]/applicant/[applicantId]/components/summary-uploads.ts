export type SummaryUploadNormalization =
  | { mode: "empty" }
  | { mode: "link"; url: string }
  | { mode: "preview"; url: string; previewUrl: string };

const googleDriveHostFragments = ["drive.google.com", "docs.google.com"];

const isGoogleDriveUrl = (url: string): boolean =>
  googleDriveHostFragments.some((fragment) => url.includes(fragment));

const extractGoogleDriveFileId = (url: string): string | null => {
  if (url.includes("/open?id=")) {
    return url.split("/open?id=")[1].split("&")[0] || null;
  }
  if (url.includes("/file/d/")) {
    return url.split("/file/d/")[1].split("/")[0] || null;
  }
  if (url.includes("?id=")) {
    return url.split("?id=")[1].split("&")[0] || null;
  }
  return null;
};

const buildGoogleDrivePreviewUrl = (fileId: string): string =>
  `https://drive.google.com/file/d/${fileId}/preview`;

export const normalizeSummaryUpload = (
  resumeUrl: string | null | undefined,
): SummaryUploadNormalization => {
  if (!resumeUrl || resumeUrl.trim().length === 0) {
    return { mode: "empty" };
  }

  if (!isGoogleDriveUrl(resumeUrl)) {
    return { mode: "link", url: resumeUrl };
  }

  const fileId = extractGoogleDriveFileId(resumeUrl);
  if (!fileId) {
    return { mode: "link", url: resumeUrl };
  }

  return {
    mode: "preview",
    url: resumeUrl,
    previewUrl: buildGoogleDrivePreviewUrl(fileId),
  };
};
