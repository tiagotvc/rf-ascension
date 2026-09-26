import { notFound } from "next/navigation";
import ClassPage from "../../../ClassPage";
import { classBySlug, classes } from "../../../data/game";

export const dynamicParams = false;
export const generateStaticParams = () => classes.filter((c) => c.grade > 0).map((c) => ({ race: c.race.toLowerCase(), slug: c.slug }));
export async function generateMetadata({ params }: { params: Promise<{ race: string; slug: string }> }) {
  const { race, slug } = await params;
  const c = classBySlug(race, slug);
  return { title: c ? `${c.name} (${c.race})` : "Classe" };
}

export default async function Page({ params }: { params: Promise<{ race: string; slug: string }> }) {
  const { race, slug } = await params;
  const cls = classBySlug(race, slug);
  if (!cls || cls.grade === 0) notFound();
  return <ClassPage cls={cls} />;
}
