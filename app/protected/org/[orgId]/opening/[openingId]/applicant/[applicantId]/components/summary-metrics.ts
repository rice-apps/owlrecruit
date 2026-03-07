export interface RubricCriterion {
  name: string;
  max_val: number;
}

export type RubricScoreMap = Record<string, unknown>;

export interface RubricCriterionSummary {
  name: string;
  average: number | null;
  maxVal: number;
  validScoreCount: number;
}

export interface RubricSummaryMetrics {
  criteria: RubricCriterionSummary[];
  overallAverage: number;
  overallMax: number;
  reviewerCount: number;
  contributingReviewCount: number;
  hasValidScores: boolean;
}

const isValidScore = (value: unknown, maxValue: number): value is number =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= 0 &&
  value <= maxValue;

export const computeRubricSummary = (
  rubrics: RubricCriterion[],
  reviews: Array<RubricScoreMap | null | undefined>,
): RubricSummaryMetrics => {
  const criteria: RubricCriterionSummary[] = [];
  const reviewContributionFlags = new Array(reviews.length).fill(false);
  let overallAverage = 0;
  let overallMax = 0;

  rubrics.forEach((rubric) => {
    overallMax += rubric.max_val;
    let sum = 0;
    let count = 0;

    reviews.forEach((review, index) => {
      if (!review) {
        return;
      }

      const value = review[rubric.name];
      if (isValidScore(value, rubric.max_val)) {
        sum += value;
        count += 1;
        reviewContributionFlags[index] = true;
      }
    });

    const average = count > 0 ? sum / count : null;
    if (average !== null) {
      overallAverage += average;
    }

    criteria.push({
      name: rubric.name,
      average,
      maxVal: rubric.max_val,
      validScoreCount: count,
    });
  });

  const contributingReviewCount =
    reviewContributionFlags.filter(Boolean).length;
  const hasValidScores = criteria.some(
    (criterion) => criterion.average !== null,
  );

  return {
    criteria,
    overallAverage: hasValidScores ? overallAverage : 0,
    overallMax,
    reviewerCount: reviews.length,
    contributingReviewCount,
    hasValidScores,
  };
};
