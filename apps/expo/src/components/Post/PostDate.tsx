import { TimeAgo } from "~/components/ui/TimeAgo";

interface PostDateProps {
  createdAt: Date;
}

const PostDate = ({ createdAt }: PostDateProps) => {
  const formatTimeAgo = ({ value, unit }: { value: number; unit: string }) => {
    if (value === 0 && unit === "second") return "Just now";
    const pluralS = value !== 1 ? "s" : "";
    return `${value} ${unit}${pluralS} ago`;
  };

  return (
    <TimeAgo
      size="$2"
      color="$gray12"
      lineHeight={0}
      date={createdAt}
      format={formatTimeAgo}
    />
  );
};

export default PostDate;
