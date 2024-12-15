import { Input, styled } from "tamagui";

const OnboardingInput = styled(Input, {
  flex: 1,
  height: 76,
  borderRadius: "$6",
  backgroundColor: "$gray3",
  paddingLeft: "$3",
  paddingRight: "$3",
  selectionColor: "$color",
  borderWidth: 0,
  color: "$color",
  fontSize: "$8",
  fontWeight: "bold",
  shadowColor: "$gray6",
});

export default OnboardingInput;
