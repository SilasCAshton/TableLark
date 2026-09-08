import PollExperience from "@/components/polls/PollExperience";

export const metadata = {
  title: "Lark Together | TableLark",
  robots: { index: false, follow: false },
};

export default async function PollPage({ params }) {
  const { slug } = await params;

  return <PollExperience slug={slug} />;
}
