import { redirect } from "next/navigation";
import { ADMIN_ANALYTICS_LIVE_PATH } from "@/lib/admin-routes";

/** /admin → glavna konzola (isti login kao i uvek). */
export default function AdminIndexPage() {
  redirect(ADMIN_ANALYTICS_LIVE_PATH);
}
