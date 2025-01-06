import { styled, Button as TamaguiButton } from "tamagui";

export const Button = styled(TamaguiButton, {
  size: "$5",
  borderRadius: "$6",
  disabledStyle: {
    opacity: 0.7,
  },

  variants: {
    variant: {
      primary: {
        backgroundColor: "$primary",
        borderColor: "white",
        pressStyle: {
          backgroundColor: "#D900E6",
          borderColor: "$primary",
        },
        textProps: {
          color: "white",
        },
      },
      white: {
        backgroundColor: "white",
        pressStyle: {
          backgroundColor: "$gray12",
          borderColor: "$primary",
        },
        borderColor: "$primary",
        textProps: {
          color: "$primary",
        },
      },
      warning: {
        color: "$yellow11",
      },
      danger: {
        color: "$red11",
      },
    },

    // Boolean props
    outlined: {
      true: {
        borderWidth: 1,
      },
    },
    rounded: {
      true: {
        borderRadius: 999,
      },
    },
  } as const,
});

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
  animation: "bouncy",
});
