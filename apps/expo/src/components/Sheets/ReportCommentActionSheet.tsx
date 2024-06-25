import { sharedValidators } from "@oppfy/validators";

import { api } from "~/utils/api";
import ActionSheet, { ButtonOption } from "./ActionSheet";

interface ReportCommentActionSheetProps {
  title: string;
  subtitle: string;
  commentId: number;
  isVisible: boolean;
  onCancel: () => void;
}

const ReportCommentActionSheet = (props: ReportCommentActionSheetProps) => {
  const { isVisible, onCancel, title, subtitle, commentId } = props;

  const reportComment = api.report.reportComment.useMutation();

  const actionSheetOptions: ButtonOption[] = [
    {
      text: "Violent or abusive",
      textProps: { color: "$blue9" },
      onPress: () =>
        reportComment.mutate({ commentId, reason: "Violent or abusive" }),
    },
    {
      text: "Sexually explicit or predatory",
      textProps: { color: "$blue9" },
      onPress: () =>
        reportComment.mutate({
          commentId,
          reason: "Sexually explicit or predatory",
        }),
    },
    {
      text: "Hate, harassment, or bullying",
      textProps: { color: "$blue9" },
      onPress: () =>
        reportComment.mutate({
          commentId,
          reason: "Hate, harassment or bullying",
        }),
    },
    {
      text: "Suicide and self-harm",
      textProps: { color: "$blue9" },
      onPress: () =>
        reportComment.mutate({ commentId, reason: "Suicide and self-harm" }),
    },
    {
      text: "Scam or spam",
      textProps: { color: "$blue9" },
      onPress: () =>
        reportComment.mutate({ commentId, reason: "Spam or scam" }),
    },
    {
      text: "Other",
      textProps: { color: "$blue9" },
      onPress: () => reportComment.mutate({ commentId, reason: "Other" }),
    },
  ];

  return (
    <ActionSheet
      title={title}
      subtitle={subtitle}
      buttonOptions={actionSheetOptions}
      isVisible={isVisible}
      onCancel={onCancel}
    />
  );
};

export default ReportCommentActionSheet;
