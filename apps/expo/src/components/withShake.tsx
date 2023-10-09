import React, { useRef, useEffect, forwardRef } from 'react';
import { Animated } from 'react-native';

interface WithShakeProps {
  triggerShake?: boolean;
  onShakeComplete?: () => void;
}

const withShake = <P extends object>(
  WrappedComponent: React.ComponentType<P>
): React.FunctionComponent<P & WithShakeProps> => {
  const WrappedWithShake = forwardRef((props: P & WithShakeProps, ref: React.Ref<any>) => {
    const { triggerShake, onShakeComplete, ...restProps } = props;
    const shakeAnim = useRef(new Animated.Value(0)).current;

    const shake = () => {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
      ]).start(() => {
        if (onShakeComplete) {
          onShakeComplete();
        }
      });
    };

    useEffect(() => {
      if (triggerShake) {
        shake();
      }
    }, [triggerShake]);

    return (
      <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
        <WrappedComponent ref={ref} {...(restProps as P)} />
      </Animated.View>
    );
  });

  WrappedWithShake.displayName = `WithShake(${getDisplayName(WrappedComponent)})`;

  return WrappedWithShake;
};

function getDisplayName(WrappedComponent: React.ComponentType<any>): string {
  return (WrappedComponent.displayName ?? WrappedComponent.name) || 'Component';
}

export default withShake;
