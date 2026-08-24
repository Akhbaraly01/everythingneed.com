// Public API for the "admin" module.

// ── Components ────────────────────────────────────────────────────────────────
export { AdminLayout } from "./components/AdminLayout";
export { AdminSidebar } from "./components/AdminSidebar";
export { DataTable } from "./components/DataTable";
export { StatCard } from "./components/StatCard";
export { StatusBadge } from "./components/StatusBadge";
export { ConfirmDialog } from "./components/ConfirmDialog";
export { FormModal } from "./components/FormModal";

// ── Existing Pages (preserved) ────────────────────────────────────────────────
export { default as AdminDashboard } from "./pages/AdminDashboard";
export { default as SuperAdminDashboard } from "./pages/SuperAdminDashboard";
export { default as CategoryAdminDashboard } from "./pages/CategoryAdminDashboard";

// ── New Admin Pages ───────────────────────────────────────────────────────────
export { default as UsersManagementPage } from "./pages/UsersManagementPage";
export { default as VendorsManagementPage } from "./pages/VendorsManagementPage";
export { default as OrdersManagementPage } from "./pages/OrdersManagementPage";
export { default as FinanceAdminPage } from "./pages/FinanceAdminPage";
export { default as AnalyticsPage } from "./pages/AnalyticsPage";
export { default as ContentManagerPage } from "./pages/ContentManagerPage";
export { default as SupportStaffPage } from "./pages/SupportStaffPage";
export { default as HealthcareAdminPage } from "./pages/HealthcareAdminPage";
export { default as LearningAdminPage } from "./pages/LearningAdminPage";
export { default as SettingsPage } from "./pages/SettingsPage";
export { default as AuditLogsPage } from "./pages/AuditLogsPage";
