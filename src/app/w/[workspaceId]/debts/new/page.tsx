import { redirect } from "next/navigation";

type NewDebtPageProps = {
  params: Promise<{ workspaceId: string }>;
};

export default async function NewDebtPage({ params }: NewDebtPageProps) {
  const { workspaceId } = await params;
  redirect(`/w/${workspaceId}`);
}
