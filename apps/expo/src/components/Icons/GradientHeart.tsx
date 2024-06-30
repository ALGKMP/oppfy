import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

interface GradientHeartProps {
  gradient: [number, number, number, number];
}

const GradientHeart = ({ gradient }: GradientHeartProps) => {
  const [x1, y1, x2, y2] = gradient;
  return (
    <Svg height="100" width="100" viewBox="0 0 24 24">
      <Defs>
        <LinearGradient
          id="grad"
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
        >
          {/* TODO: Find better colors */}
          <Stop offset="0" stopColor="#ff7f7f" stopOpacity="1" />
          <Stop offset="1" stopColor="#ff0000" stopOpacity="1" />
        </LinearGradient>
      </Defs>
      <Path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill="url(#grad)"
      />
    </Svg>
  );
};

export default GradientHeart;