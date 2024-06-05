import React from "react";
import { SizableText } from "tamagui";

interface ListHeaderProps {
  title: string;
}

const ListHeader = ({ title }: ListHeaderProps) => (
  <SizableText size="$2" theme="alt1">
    {title}
  </SizableText>
);

export default ListHeader;
