import { PasswordForm } from "@/components/admin/forms/PageForms";
import { PageTitle, Card } from "@/components/admin/kit";
import { getMe } from "@/lib/admin/api";

// The panel is private and always reads live data: let the page block on the server.
export const instant = false;

export const metadata = { title: "My account" };

export default async function AccountPage() {
  const me = await getMe("/admin/account");
  return (
    <div className="flex flex-col gap-6">
      <PageTitle eyebrow="Account" title="My account" description={`Signed in as ${me.username}${me.email ? ` (${me.email})` : ""}.`} />
      <Card title="Change password" className="max-w-xl">
        <PasswordForm />
      </Card>
    </div>
  );
}
