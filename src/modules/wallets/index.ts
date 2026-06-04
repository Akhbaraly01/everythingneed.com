// Public API for the "wallets" module.
// Other modules MUST import only from "@modules/wallets", never reach into
// subfolders. This is the seam that lets us physically relocate files later
// (and ultimately migrate to a Laravel Modules/Wallets package)
// without breaking consumers.

export { default as Wallet } from "@/pages/account/Wallet";
