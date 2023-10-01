import React, { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

interface WithShakeProps {
  triggerShake?: boolean;
  onShakeComplete?: () => void;
}

const withShake = <P extends object>(
  WrappedComponent: React.ComponentType<P>
): React.FunctionComponent<P & WithShakeProps> => {
  return ({ triggerShake, onShakeComplete, ...props }) => {
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
          onShakeComplete();  // Inform the parent component that the shake is done
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
        <WrappedComponent {...(props as P)} />
      </Animated.View>
    );
  };
};

export default withShake;
