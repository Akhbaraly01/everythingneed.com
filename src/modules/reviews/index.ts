// Public API for the "reviews" module.
// Other modules MUST import only from "@modules/reviews", never reach into
// subfolders. This is the seam that lets us physically relocate files later
// (and ultimately migrate to a Laravel Modules/Reviews package)
// without breaking consumers.

export { default as ExpertReviewForm } from "@/components/experts/ExpertReviewForm";
export { default as ExpertReviewsList } from "@/components/experts/ExpertReviewsList";
export { useExpertReviews } from "@/hooks/useExpertReviews";
