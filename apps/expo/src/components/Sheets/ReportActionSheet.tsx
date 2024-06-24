import { useState } from "react";

import ActionSheet, { ButtonOption } from "../Sheets/ActionSheet";

// can you make this work for commetns or posts
interface ReportCommentActionSheetProps {
  title: string;
  subtitle: string;
  commentId: number;
  isVisible: boolean;
  onCancel: () => void;
}

interface ReportPostActionSheetProps {
  title: string;
  subtitle: string;
  postId: number;
  isVisible: boolean;
  onCancel: () => void;
}

type ReportActionSheetProps =
  | ReportPostActionSheetProps
  | ReportCommentActionSheetProps;

const ReportActionSheet = (props: ReportActionSheetProps) => {
  const { isVisible, onCancel } = props;
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
  return (
    <ActionSheet
      title={props.title}
      subtitle={props.subtitle}
      buttonOptions={actionSheetOptions}
      isVisible={isVisible}
      onCancel={onCancel}
    />
  );
};

export default ReportActionSheet;
