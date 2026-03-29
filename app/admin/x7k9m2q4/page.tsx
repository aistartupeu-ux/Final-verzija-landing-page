import { AdminAnalyticsDashboard } from "@/components/admin/AdminAnalyticsDashboard";

/** Zamrznut prikaz — isti UI, bez učitavanja podataka (arhiva). Aktivna konzola: /admin/live */
export default function AdminFrozenDashPage() {
  return <AdminAnalyticsDashboard frozen />;
}
