import React from "react";
import { Skeleton } from "moti/skeleton";
import { Avatar, Button, SizableText, XStack, YStack } from "tamagui";

type Icon = JSX.Element;

interface ButtonProps {
  title: string;
  onPress?: () => void;
  icon?: Icon;
  iconAfter?: Icon;
}

interface LoadingProps {
  loading: true;
  showSkeletons?: {
    imageUrl?: boolean;
    title?: boolean;
    subtitle?: boolean;
    subtitle2?: boolean;
    button?: boolean;
    button2?: boolean;
  };
}

interface LoadedProps {
  loading: false;
  imageUrl?: string;
  title?: string;
  subtitle?: string;
  subtitle2?: string;
  button?: ButtonProps | React.ReactNode;
  button2?: ButtonProps | React.ReactNode;
}

type VirtualizedListItemProps = LoadingProps | LoadedProps;

const VirtualizedListItem: React.FC<VirtualizedListItemProps> = (props) => (
  <Skeleton.Group show={props.loading}>
    <XStack flex={1} alignItems="center" paddingVertical="$2">
      <XStack flex={1} alignItems="center" gap="$3">
        {props.loading && props.showSkeletons?.imageUrl ? (
          <Skeleton radius={100}>
            <Avatar circular size="$5" />
          </Skeleton>
        ) : !props.loading && props.imageUrl ? (
          <Avatar circular size="$5">
            <Avatar.Image src={props.imageUrl} />
          </Avatar>
        ) : null}

        <YStack>
          {props.loading && props.showSkeletons?.title ? (
            <Skeleton width={75}>
              <SizableText>Loading...</SizableText>
            </Skeleton>
          ) : !props.loading && props.title ? (
            <SizableText>{props.title}</SizableText>
          ) : null}

          {props.loading && props.showSkeletons?.subtitle ? (
            <Skeleton width={100}>
              <SizableText>Loading...</SizableText>
            </Skeleton>
          ) : !props.loading && props.subtitle ? (
            <SizableText>{props.subtitle}</SizableText>
          ) : null}

          {props.loading && props.showSkeletons?.subtitle2 ? (
            <Skeleton width={100}>
              <SizableText>Loading...</SizableText>
            </Skeleton>
          ) : !props.loading && props.subtitle2 ? (
            <SizableText>{props.subtitle2}</SizableText>
          ) : null}
        </YStack>
      </XStack>

      <XStack gap="$2">
        {props.loading && props.showSkeletons?.button ? (
          <Skeleton>
            <Button size="$3">Loading...</Button>
          </Skeleton>
        ) : !props.loading && props.button ? (
          React.isValidElement(props.button) ? (
            props.button
          ) : (
            <Button size="$3" {...(props.button2 as ButtonProps)}>
              {props.button}
            </Button>
          )
        ) : null}

        {props.loading && props.showSkeletons?.button2 ? (
          <Skeleton>
            <Button size="$3">Loading...</Button>
          </Skeleton>
        ) : !props.loading && props.button2 ? (
          React.isValidElement(props.button2) ? (
            props.button2
          ) : (
            <Button size="$3" {...(props.button2 as ButtonProps)}>
              {props.button2}
            </Button>
          )
        ) : null}
      </XStack>
    </XStack>
  </Skeleton.Group>
);

export default VirtualizedListItem;
