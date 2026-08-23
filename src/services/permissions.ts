import type { SessionUser } from "@/lib/auth";
import { ForbiddenError } from "@/lib/errors";

export type Action = "create" | "edit" | "delete" | "approve" | "reject" | "resubmit" | "view" | "manage" | "export";
export type Resource = "time-entry" | "params" | "users" | "audit" | "reports";

export function checkPermission(user: SessionUser, action: Action, resource: Resource): void {
  const adminAllowed: Action[] = ["create", "edit", "delete", "view", "manage", "export"];
  const jlAllowed: Action[] = ["create", "edit", "approve", "reject", "view", "export"];
  const funcAllowed: Action[] = ["create", "edit", "resubmit", "view", "export"];

  const allowed = user.papel === "ADMIN" ? adminAllowed : user.papel === "JOB_LEADER" ? jlAllowed : funcAllowed;

  if (!allowed.includes(action)) throw new ForbiddenError();
  if (resource === "params" || resource === "users") {
    if (user.papel !== "ADMIN") throw new ForbiddenError();
  }
}
