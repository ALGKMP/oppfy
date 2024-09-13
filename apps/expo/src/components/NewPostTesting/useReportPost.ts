import { useToastController } from "@tamagui/toast";
import { api } from "~/utils/api";
import type { RouterInputs } from "~/utils/api";

type ReportPostReason = RouterInputs["report"]["reportPost"]["reason"];

export const useReportPost = (postId: string) => {
  const toast = useToastController();
  const reportPost = api.report.reportPost.useMutation();

  const handleReportPost = async (reason: ReportPostReason) => {
    await reportPost.mutateAsync({ postId, reason });
    toast.show("Post Reported");
  };

  return { handleReportPost };
};