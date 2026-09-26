import { notFound } from "next/navigation";
import SkillsPage from "../../SkillsPage";

export const dynamicParams = false;
export const generateStaticParams = () => [{ group: "melee" }, { group: "range" }];
export async function generateMetadata({ params }: { params: Promise<{ group: string }> }) {
  return { title: (await params).group === "melee" ? "Skills de Melee" : "Skills de Range" };
}

export default async function Page({ params }: { params: Promise<{ group: string }> }) {
  const { group } = await params;
  if (group !== "melee" && group !== "range") notFound();
  return <SkillsPage group={group} />;
}
