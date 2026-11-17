import { Users } from "lucide-react";
import { AddButton, Flag, ResourceList } from "@/components/admin/ResourceList";
import { PageTitle } from "@/components/admin/kit";
import type { Column } from "@/components/admin/DataTable";
import { getMe, type StaffAccount } from "@/lib/admin/api";

// The panel is private and always reads live data: let the page block on the server.
export const instant = false;

export const metadata = { title: "Staff accounts" };

const columns: Column<StaffAccount>[] = [
  { key: "username", label: "Username", sort: "username", cell: (u) => u.username },
  { key: "name", label: "Name", cell: (u) => <span className="text-muted">{[u.firstName, u.lastName].filter(Boolean).join(" ") || "—"}</span> },
  { key: "email", label: "Email", cell: (u) => <span className="text-muted">{u.email}</span> },
  { key: "roles", label: "Roles", cell: (u) => <span className="text-muted">{u.isSuperuser ? "Administrator" : u.roleNames.join(", ") || "No role"}</span> },
  { key: "last", label: "Last sign-in", sort: "last_login", cell: (u) => <span className="whitespace-nowrap text-muted">{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString("en-IN") : "Never"}</span> },
  { key: "active", label: "Access", cell: (u) => <Flag on={u.isActive} yes="Can sign in" no="Disabled" /> },
];

export default async function UsersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const me = await getMe("/admin/users");
  if (!me.isSuperuser) {
    return <p className="text-muted">Only administrators manage staff accounts.</p>;
  }
  return (
    <div className="flex flex-col gap-6">
      <PageTitle eyebrow="Team" title="Staff accounts" description="Who can sign in to this panel, and what they can see. Roles decide their access." actions={<AddButton href="/admin/users/new" label="Add person" />} />
      <ResourceList<StaffAccount>
        basePath="/admin/users"
        endpoint="users/"
        searchParams={searchParams}
        columns={columns}
        filters={[{ param: "active", label: "Access", any: "Everyone", options: [{ value: "true", label: "Can sign in" }, { value: "false", label: "Disabled" }] }]}
        searchPlaceholder="Search name, username or email"
        emptyTitle="No staff accounts yet"
        emptyText="Add the people who will use this panel."
        caption="Staff accounts"
        icon={Users}
      />
    </div>
  );
}
