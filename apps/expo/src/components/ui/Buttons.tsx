import { styled, Button as TamaguiButton } from "tamagui";

export const Button = styled(TamaguiButton, {
  backgroundColor: "$primary",
  borderRadius: "$6",
  hoverStyle: {
    backgroundColor: "$primaryDark",
  },
  pressStyle: {
    backgroundColor: "$primaryLight",
  },
});
