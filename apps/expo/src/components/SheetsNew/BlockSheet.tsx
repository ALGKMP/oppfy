import { ActionSheet, ButtonOption } from "~/components/ui/ActionSheet";
import { api } from "~/utils/api";

const BlockSheet = ({ userId }: { userId: string }) => {

  return (
    <ActionSheet
      isVisible={true}
      title="Block"
      buttonOptions={[
        {
          text: "Block",
          onPress: () => {
            // blockUser.mutate({ userId });
          },
          textProps: { color: "$red9" },
        },
      ]}
    />
  );
};

export default BlockSheet;
