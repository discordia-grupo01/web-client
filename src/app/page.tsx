import { redirect } from "next/navigation";

import { getSession } from "@/features/auth/session";
import { ROUTES } from "@/lib/constants";

export default function IndexPage(): never {
  redirect(getSession() ? ROUTES.home : ROUTES.login);
}
