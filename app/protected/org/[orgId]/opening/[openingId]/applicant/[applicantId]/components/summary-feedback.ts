export interface ReviewerComment {
  id: string;
  content: string;
  createdAt: string;
  userName?: string | null;
  userId?: string | null;
}

export interface NormalizedReviewerFeedback {
  id: string;
  content: string;
  createdAt: string;
  userName: string;
  userId?: string | null;
}

const UNKNOWN_REVIEWER = "Unknown Reviewer";

const REVIEWER_ID_PREFIX = "id:";
const REVIEWER_NAME_PREFIX = "name:";

const getReviewerIdentity = (comment: ReviewerComment): string => {
  if (comment.userId) {
    return `${REVIEWER_ID_PREFIX}${comment.userId}`;
  }

  const normalizedName = comment.userName?.trim().toLowerCase();
  if (normalizedName) {
    return `${REVIEWER_NAME_PREFIX}${normalizedName}`;
  }

  return comment.id;
};

const getReviewerLabel = (comment: ReviewerComment): string => {
  const name = comment.userName?.trim();
  return name && name.length > 0 ? name : UNKNOWN_REVIEWER;
};

const toTimestamp = (value: string): number => {
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? 0 : ms;
};

export const normalizeReviewerFeedback = (
  comments: ReviewerComment[],
): NormalizedReviewerFeedback[] => {
  const latestPerReviewer = new Map<string, ReviewerComment>();

  for (const comment of comments) {
    const identity = getReviewerIdentity(comment);
    const existing = latestPerReviewer.get(identity);

    if (
      !existing ||
      toTimestamp(comment.createdAt) > toTimestamp(existing.createdAt)
    ) {
      latestPerReviewer.set(identity, comment);
    }
  }

  return Array.from(latestPerReviewer.values())
    .sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt))
    .map((comment) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      userName: getReviewerLabel(comment),
      userId: comment.userId ?? null,
    }));
};
