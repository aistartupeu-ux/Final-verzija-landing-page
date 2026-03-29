import { AdminAnalyticsDashboard } from "@/components/admin/AdminAnalyticsDashboard";

/** Stari URL — leadovi samo do ADMIN_ANALYTICS_LEGACY_CUTOFF_ISO (bez novih ulazaka u brojeve). */
export default function AdminDashPage() {
  return <AdminAnalyticsDashboard legacy />;
}

