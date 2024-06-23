import { useState } from "react";

import ActionSheet, { ButtonOption } from "../Sheets/ActionSheet";

const actionSheetOptions = [
  {
    text: "Violent or abusive",
    textProps: {
      color: "$blue9",
    },
    onPress: () => {
      console.log("Report");
    },
  },
  {
    text: "Sexually explicit or predatory",
    textProps: {
      color: "$blue9",
    },
    onPress: () => {
      console.log("Report");
    },
  },
  {
    text: "Hate, harassment, or bullying",
    textProps: {
      color: "$blue9",
    },
    onPress: () => {
      console.log("Report");
    },
  },
  {
    text: "Suicide and self-harm",
    textProps: {
      color: "$blue9",
    },
    onPress: () => {
      console.log("Report");
    },
  },
  {
    text: "Scam or spam",
    textProps: {
      color: "$blue9",
    },
    onPress: () => {
      console.log("Report");
    },
  },
  {
    text: "Other",
    textProps: {
      color: "$blue9",
    },
    onPress: () => {
      console.log("Report");
    },
  },
] satisfies ButtonOption[];

interface ReportActionSheetProps {
  isVisible: boolean;
  onCancel: () => void;
}

const ReportActionSheet = (props: ReportActionSheetProps) => {
  const { isVisible, onCancel } = props;
  return (
    <ActionSheet
      title={"Report"}
      subtitle={"Are you sure you want to report this comment?"}
      buttonOptions={actionSheetOptions}
      isVisible={isVisible}
      onCancel={onCancel}
    />
  );
};

export default ReportActionSheet;