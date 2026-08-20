import { describe, it, expect } from "vitest";
import { checkPermission } from "@/services/permissions";
import { ForbiddenError } from "@/lib/errors";

const userAdmin = { id: "a", nome: "A", email: "a@mcm.local", papel: "ADMIN" as const };
const userJL = { id: "j", nome: "J", email: "j@mcm.local", papel: "JOB_LEADER" as const };
const userFunc = { id: "f", nome: "F", email: "f@mcm.local", papel: "FUNCIONARIO" as const };

describe("checkPermission", () => {
  it("admin pode aprovar? não", () => {
    expect(() => checkPermission(userAdmin, "approve", "time-entry")).toThrow(ForbiddenError);
  });
  it("job leader pode aprovar? sim", () => {
    expect(() => checkPermission(userJL, "approve", "time-entry")).not.toThrow();
  });
  it("funcionário pode aprovar? não", () => {
    expect(() => checkPermission(userFunc, "approve", "time-entry")).toThrow(ForbiddenError);
  });
  it("funcionário pode criar? sim", () => {
    expect(() => checkPermission(userFunc, "create", "time-entry")).not.toThrow();
  });
  it("job leader não gerencia parâmetros", () => {
    expect(() => checkPermission(userJL, "manage", "params")).toThrow(ForbiddenError);
  });
  it("admin gerencia parâmetros", () => {
    expect(() => checkPermission(userAdmin, "manage", "params")).not.toThrow();
  });
});
