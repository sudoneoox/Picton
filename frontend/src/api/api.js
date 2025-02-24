import { auth } from "@/api/authentication"
import { admin } from "@/api/admin_dashboard"
import { pretty_log, API_BASE_URL, MICROSOFT_FRONTEND_REDIRECT_URL, DEBUG } from "@/api/common_util"


export const api = {
  auth,
  admin
};
