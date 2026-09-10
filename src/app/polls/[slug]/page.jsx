import PollExperience from "@/components/polls/PollExperience";

export const metadata = {
  title: "Group Favorite | TableLark",
  robots: { index: false, follow: false },
};

export default async function PollPage({ params }) {
  const { slug } = await params;

  return <PollExperience slug={slug} />;
}
