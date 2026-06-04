// Public API for the "learn" module.
// Other modules MUST import only from "@modules/learn", never reach into
// subfolders. This is the seam that lets us physically relocate files later
// (and ultimately migrate to a Laravel Modules/Learn package)
// without breaking consumers.

export { default as Learn } from "@/pages/Learn";
export { default as CourseDetail } from "@/pages/learn/CourseDetail";
export { default as LearningDashboard } from "@/pages/account/LearningDashboard";
export { useCourseCompletion } from "@/hooks/useCourseCompletion";
