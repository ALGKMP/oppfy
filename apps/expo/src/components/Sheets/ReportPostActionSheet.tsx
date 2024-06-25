import { api } from "~/utils/api";
import ActionSheet, { ButtonOption } from "../Sheets/ActionSheet";
import { sharedValidators } from "@oppfy/validators";

interface ReportPostActionSheetProps {
  title: string;
  subtitle: string;
  postId: number;
  isVisible: boolean;
  onCancel: () => void;
}

const ReportPostActionSheet = (props: ReportPostActionSheetProps) => {
  const { isVisible, onCancel, title, subtitle, postId } = props;

  const reportPost = api.report.reportPost.useMutation();

  const actionSheetOptions: ButtonOption[] = [
    {
      text: "Violent or abusive",
      textProps: { color: "$blue9" },
      onPress: () => reportPost.mutate({ postId, reason: "Violent or abusive" }),
    },
    {
      text: "Sexually explicit or predatory",
      textProps: { color: "$blue9" },
      onPress: () => reportPost.mutate({ postId, reason: "Sexually explicit or predatory" }),
    },
    {
      text: "Hate, harassment, or bullying",
      textProps: { color: "$blue9" },
      onPress: () => reportPost.mutate({ postId, reason: "Hate, harassment or bullying" }),
    },
    {
      text: "Suicide and self-harm",
      textProps: { color: "$blue9" },
      onPress: () => reportPost.mutate({ postId, reason: "Suicide and self-harm" }),
    },
    {
      text: "Scam or spam",
      textProps: { color: "$blue9" },
      onPress: () => reportPost.mutate({ postId, reason: "Spam or scam" }),
    },
    {
      text: "Other",
      textProps: { color: "$blue9" },
      onPress: () => reportPost.mutate({ postId, reason: "Other" }),
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

export default ReportPostActionSheet;