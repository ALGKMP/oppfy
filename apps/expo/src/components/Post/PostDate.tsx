import { SizableText } from "~/components/ui/";
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
    <SizableText size="$2" color="$gray10">
      <TimeAgo
        size="$2"
        theme="alt2"
        lineHeight={0}
        date={createdAt}
        format={formatTimeAgo}
      />
    </SizableText>
  );
};

export default PostDate;
