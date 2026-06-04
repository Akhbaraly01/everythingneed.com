// Public API for the "jobs" module.
// Other modules MUST import only from "@modules/jobs", never reach into
// subfolders. This is the seam that lets us physically relocate files later
// (and ultimately migrate to a Laravel Modules/Jobs package)
// without breaking consumers.

export { default as Jobs } from "@/pages/deals/Jobs";
export { default as JobCard } from "@/components/booking/JobCard";
