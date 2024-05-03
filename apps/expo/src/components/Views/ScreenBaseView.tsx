import type { ViewProps } from "tamagui";
import { View } from "tamagui";

interface ScreenBaseViewProps extends ViewProps {
  children: React.ReactNode;
}

const ScreenBaseView = ({ children, ...props }: ScreenBaseViewProps) => {
  return (
    <View flex={1} padding="$4" backgroundColor="$background" {...props}>
      {children}
    </View>
  );
};

export default ScreenBaseView;