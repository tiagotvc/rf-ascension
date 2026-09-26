import { notFound } from "next/navigation";
import RacePage from "../../RacePage";
import { raceByParam, races } from "../../data/game";

export const dynamicParams = false;
export const generateStaticParams = () => races.map((r) => ({ race: r.id }));
export async function generateMetadata({ params }: { params: Promise<{ race: string }> }) {
  const race = raceByParam((await params).race);
  return { title: race ? `Classes de ${race.name}` : "Classes" };
}

export default async function Page({ params }: { params: Promise<{ race: string }> }) {
  const race = raceByParam((await params).race);
  if (!race) notFound();
  return <RacePage raceId={race.id} />;
}
