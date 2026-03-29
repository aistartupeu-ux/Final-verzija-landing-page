import { AdminAnalyticsDashboard } from "@/components/admin/AdminAnalyticsDashboard";

/** Aktivna konzola — API, realtime, interval; snimak za arhivu: „Sačuvaj u arhivu“. */
export default function AdminLivePage() {
  return <AdminAnalyticsDashboard variant="live" />;
}
