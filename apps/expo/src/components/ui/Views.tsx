import {
  styled,
  ScrollView as TamaguiScrollView,
  View as TamaguiView,
} from "tamagui";

export const View = styled(TamaguiView, {});
export const ScrollView = styled(TamaguiScrollView, {});

export const ScreenView = styled(TamaguiView, {
  flex: 1,
  paddingHorizontal: "$2",
});
