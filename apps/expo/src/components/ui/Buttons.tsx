import { styled, Button as TamaguiButton } from "tamagui";

export const Button = styled(TamaguiButton, {});

export const OnboardingButton = styled(Button, {
  height: 60,
  borderWidth: 0,
  borderRadius: 0,
  backgroundColor: "$color",
  elevation: 5,
  shadowRadius: 10,
  shadowOpacity: 0.4,
  textProps: {
    color: "$color1",
    fontWeight: "bold",
    fontSize: 18,
  },
  pressStyle: {
    backgroundColor: "$color11",
  },
  disabledStyle: {
    backgroundColor: "$color9",
    opacity: 0.7,
  },
});
