import React from "react";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { BottomSheetBackdrop as GorhomBackdrop } from "@gorhom/bottom-sheet";

interface CustomBackdropProps extends BottomSheetBackdropProps {
  opacity?: number;
}

const BottomSheetBackdrop = ({
  opacity = 0.5,
  ...props
}: CustomBackdropProps) => (
  <GorhomBackdrop
    appearsOnIndex={0}
    disappearsOnIndex={-1}
    opacity={opacity}
    {...props}
  />
);

export default BottomSheetBackdrop;
