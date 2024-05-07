import {
  AlertDialog as BaseAlertDialog,
  Button,
  XStack,
  YStack,
} from "tamagui";

const AlertDialog = () => {
  return (
    <BaseAlertDialog native>
      <BaseAlertDialog.Trigger asChild>
        <TouchableOpacity hitSlop={10}>
          <X />
        </TouchableOpacity>
      </BaseAlertDialog.Trigger>

      <BaseAlertDialog.Portal>
        <BaseAlertDialog.Overlay
          key="overlay"
          animation="quick"
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <BaseAlertDialog.Content
          width="75%"
          bordered
          elevate
          key="content"
          animation={[
            "quick",
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
          enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
          exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
          x={0}
          scale={1}
          opacity={1}
          y={0}
        >
          <YStack alignItems="center" gap="$3">
            <BaseAlertDialog.Title>Exit Onboarding</BaseAlertDialog.Title>
            <BaseAlertDialog.Description textAlign="center">
              Are you sure you want to quit? You&apos;ll lose any changes
              you&apos;ve made.
            </BaseAlertDialog.Description>

            <XStack justifyContent="flex-end" gap="$3">
              <BaseAlertDialog.Cancel asChild>
                <Button size="$4" flex={1}>
                  Stay
                </Button>
              </BaseAlertDialog.Cancel>
              <BaseAlertDialog.Action onPress={onSubmit} asChild>
                <Button flex={1} theme="active">
                  Leave
                </Button>
              </BaseAlertDialog.Action>
            </XStack>
          </YStack>
        </BaseAlertDialog.Content>
      </BaseAlertDialog.Portal>
    </BaseAlertDialog>
  );
};

export default AlertDialog;
