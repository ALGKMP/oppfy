import { api } from "~/utils/api";
import ActionSheet, { ButtonOption } from "../Sheets/ActionSheet";
import { sharedValidators } from "@oppfy/validators";

interface ReportUserActionSheetProps {
  title: string;
  subtitle: string;
  targetUserId: string;
  isVisible: boolean;
  onCancel: () => void;
}

const ReportUserActionSheet = (props: ReportUserActionSheetProps) => {
  const { isVisible, onCancel, title, subtitle, targetUserId } = props;

  const reportUser = api.report.reportUser.useMutation();

  const actionSheetOptions: ButtonOption[] = [
    {
      text: "Posting explicit content",
      textProps: { color: "$blue9" },
      onPress: () => reportUser.mutate({ targetUserId, reason: "Posting explicit content" }),
    },
    {
      text: "Under the age of 13",
      textProps: { color: "$blue9" },
      onPress: () => reportUser.mutate({ targetUserId, reason: "Under the age of 13" }),
    },
    {
      text: "Catfish account",
      textProps: { color: "$blue9" },
      onPress: () => reportUser.mutate({ targetUserId, reason: "Catfish account" }),
    },
    {
      text: "Scam/spam account",
      textProps: { color: "$blue9" },
      onPress: () => reportUser.mutate({ targetUserId, reason: "Scam/spam account" }),
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

export default ReportUserActionSheet;