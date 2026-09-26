import { notFound } from "next/navigation";
import ForcesPage from "../../ForcesPage";
import { forceTrees } from "../../data/game";

export const dynamicParams = false;
export const generateStaticParams = () => forceTrees.map((t) => ({ tree: t.id }));
export async function generateMetadata({ params }: { params: Promise<{ tree: string }> }) {
  const { tree } = await params;
  const t = forceTrees.find((x) => x.id === tree);
  return { title: t ? `Forces de ${t.name}` : "Forces" };
}

export default async function Page({ params }: { params: Promise<{ tree: string }> }) {
  const { tree: id } = await params;
  const tree = forceTrees.find((x) => x.id === id);
  if (!tree) notFound();
  return <ForcesPage treeId={tree.id} />;
}
