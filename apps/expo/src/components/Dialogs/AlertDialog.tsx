import {
  AlertDialog as BaseAlertDialog,
  Button,
  XStack,
  YStack,
} from "tamagui";

interface AlertDialogProps {
  title: string;
  subtitle?: string;

  acceptText?: string;
  cancelText?: string;

  trigger: JSX.Element;

  isVisible?: boolean;
  onAccept?: () => void;
  onCancel?: () => void;
}

const AlertDialog = ({
  title,
  subtitle,
  acceptText,
  cancelText,
  trigger,
  isVisible,
  onCancel,
  onAccept,
}: AlertDialogProps) => {
  return (
    <BaseAlertDialog native>
      <BaseAlertDialog.Trigger asChild>{trigger}</BaseAlertDialog.Trigger>

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
            <BaseAlertDialog.Title>{title}</BaseAlertDialog.Title>
            {subtitle && (
              <BaseAlertDialog.Description textAlign="center">
                {subtitle}
              </BaseAlertDialog.Description>
            )}

            <XStack justifyContent="flex-end" gap="$3">
              <BaseAlertDialog.Cancel asChild>
                <Button size="$4" flex={1}>
                  {cancelText ?? "Cancel"}
                </Button>
              </BaseAlertDialog.Cancel>
              <BaseAlertDialog.Action onPress={onAccept} asChild>
                <Button flex={1} theme="active">
                  {acceptText ?? "Accept"}
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
