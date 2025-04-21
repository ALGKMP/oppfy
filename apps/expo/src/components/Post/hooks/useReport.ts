import { useToastController } from "@tamagui/toast";

import { api, RouterInputs } from "~/utils/api";

type ReportPostReason = RouterInputs["report"]["reportPost"]["reason"];
type ReportCommentReason = RouterInputs["report"]["reportComment"]["reason"];

interface ReportPostProps {
  postId: string;
  reason: ReportPostReason;
}

interface ReportCommentProps {
  commentId: string;
  reason: ReportCommentReason;
}

const useReport = () => {
  const toast = useToastController();

  const reportPostMutation = api.report.reportPost.useMutation();
  const reportCommentMutation = api.report.reportComment.useMutation();

  const reportPost = async ({ postId, reason }: ReportPostProps) => {
    await reportPostMutation.mutateAsync({ postId, reason });
    toast.show("Post Reported");
  };

  const reportComment = async ({ commentId, reason }: ReportCommentProps) => {
    await reportCommentMutation.mutateAsync({ commentId, reason });
    toast.show("Comment Reported");
  };

  return {
    reportPost,
    reportComment,
  };
};

export { useReport };
