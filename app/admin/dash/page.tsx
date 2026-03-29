import { redirect } from "next/navigation";
import { ADMIN_ANALYTICS_LIVE_PATH } from "@/lib/admin-routes";

export default function AdminDashRedirectPage() {
  redirect(ADMIN_ANALYTICS_LIVE_PATH);
}
