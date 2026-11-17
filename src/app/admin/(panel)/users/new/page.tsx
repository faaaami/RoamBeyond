import { UserForm } from "@/components/admin/forms/PageForms";
import { PageTitle } from "@/components/admin/kit";
import { submitRecord } from "@/lib/admin/actions";
import { getOptions } from "@/lib/admin/api";

// The panel is private and always reads live data: let the page block on the server.
export const instant = false;

export const metadata = { title: "New staff account" };

export default async function NewUser() {
  const options = await getOptions("/admin/users/new");
  return (
    <div className="flex flex-col gap-6">
      <PageTitle eyebrow="Team" title="New staff account" description="Give them a password and a role. They can change the password later from My account." />
      <UserForm
        action={submitRecord.bind(null, { path: "users/", method: "POST", redirectTo: "/admin/users/{id}", message: "Account created." })}
        initial={{ username: "", email: "", firstName: "", lastName: "", password: "", isActive: true, isSuperuser: false, roles: [] }}
        options={options}
        editing={false}
      />
    </div>
  );
}
