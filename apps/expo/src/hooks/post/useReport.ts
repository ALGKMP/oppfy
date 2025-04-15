import { useToastController } from "@tamagui/toast";
import type { ReportPostReason } from "node_modules/@oppfy/api/src/models";

import { api } from "~/utils/api";

interface ReportPostProps {
  postId: string;
}

export const useReport = ({
  postId,
}: ReportPostProps) => {
  const toast = useToastController();

  const reportPost = api.report.reportPost.useMutation();

  const reportCommentMutation = api.report.reportComment.useMutation();


  const handleReportComment = async (commentId: string) => {
    await reportCommentMutation.mutateAsync({ commentId, reason: "Other" });
    toast.show("Comment Reported");
  };

  const handleReportPost = async (reason: ReportPostReason) => {
    await reportPost.mutateAsync({ postId, reason });
    toast.show("Post Reported");
  };

  return {
    handleReportComment,
    handleReportPost,
  };
};
