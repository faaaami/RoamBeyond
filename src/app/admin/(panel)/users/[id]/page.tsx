import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { UserForm } from "@/components/admin/forms/PageForms";
import { PageTitle } from "@/components/admin/kit";
import { deleteRecord, submitRecord } from "@/lib/admin/actions";
import { adminFind, getMe, getOptions, type StaffAccount } from "@/lib/admin/api";

// The panel is private and always reads live data: let the page block on the server.
export const instant = false;

export const metadata = { title: "Edit staff account" };

export default async function EditUser({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const returnTo = `/admin/users/${id}`;
  const [user, options, me] = await Promise.all([adminFind<StaffAccount>(`users/${id}/`, returnTo), getOptions(returnTo), getMe(returnTo)]);
  if (!user) notFound();
  const isSelf = user.id === me.id;

  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        eyebrow="Team"
        title={user.username}
        description={isSelf ? "This is your account. You cannot switch off your own access or remove your administrator role." : undefined}
        actions={
          !isSelf && (
            <ConfirmButton
              action={deleteRecord.bind(null, { path: `users/${id}/`, redirectTo: "/admin/users", message: "Account deleted." })}
              label="Delete"
              title={`Delete ${user.username}?`}
              body={<p>They will no longer be able to sign in. Their past changes stay in the activity history.</p>}
              confirmLabel="Yes, delete account"
            />
          )
        }
      />
      <UserForm
        action={submitRecord.bind(null, { path: `users/${id}/`, method: "PATCH", redirectTo: `/admin/users/${id}`, message: "Account saved." })}
        initial={{ ...user, roles: user.roles.map(String) }}
        options={options}
        editing
      />
    </div>
  );
}
