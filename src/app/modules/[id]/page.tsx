import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { CustomModulePage } from "@/components/CustomModulePage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mod = await db.customModule.findUnique({ where: { moduleId: id } });
  if (!mod) notFound();
  return <CustomModulePage mod={mod} />;
}
