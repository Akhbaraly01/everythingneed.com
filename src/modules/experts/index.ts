// Public API for the "experts" module.
// Other modules MUST import only from "@modules/experts", never reach into
// subfolders. This is the seam that lets us physically relocate files later
// (and ultimately migrate to a Laravel Modules/Experts package)
// without breaking consumers.

export { default as ExpertsDirectory } from "@/pages/experts/ExpertsDirectory";
export { default as ExpertProfile } from "@/pages/experts/ExpertProfile";
export { default as ExpertsShowcase } from "@/components/experts/ExpertsShowcase";
export { useExpertAvailability } from "@/hooks/useExpertAvailability";
export { useExpertWishlist } from "@/hooks/useExpertWishlist";
