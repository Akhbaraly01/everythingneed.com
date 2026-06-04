// Public API for the "needs" module.
// Other modules MUST import only from "@modules/needs", never reach into
// subfolders. This is the seam that lets us physically relocate files later
// (and ultimately migrate to a Laravel Modules/Needs package)
// without breaking consumers.

export { default as NeedCategoryPage } from "@/pages/needs/NeedCategoryPage";
export { default as SubmitRequest } from "@/pages/needs/SubmitRequest";
export { default as NeedRequestForm } from "@/components/needs/NeedRequestForm";
