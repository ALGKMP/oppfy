 // apps/expo/src/utils/dialogNew.ts
import type { AlertDialogNewProps } from "../components/Dialogs/AlertDialogNew";
import { useDialogNew } from "../components/Dialogs/DialogManagerNew";

type AlertOptions = Pick<
  AlertDialogNewProps,
  "title" | "subtitle" | "acceptText" | "cancelText" | "titleProps" | "subtitleProps" | "acceptTextProps" | "cancelTextProps"
>;

export const useAlertDialogNew = () => {
  const { showDialog, hideDialog } = useDialogNew();

  const alert = (options: AlertOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      showDialog({
        ...options,
        onAccept: () => {
          hideDialog();
          resolve(true);
        },
        onCancel: () => {
          hideDialog();
          resolve(false);
        },
      });
    });
  };

  return { alert };
};