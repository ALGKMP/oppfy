import type { FunctionComponent } from "react";
import React, { useMemo } from "react";
import { TouchableOpacity } from "react-native";
import debounce from "lodash/debounce";
import { Skeleton } from "moti/skeleton";
import type { ThemeName } from "tamagui";
import { Avatar, Button, SizableText, XStack, YStack } from "tamagui";

type Icon = JSX.Element | FunctionComponent;

export interface ButtonProps {
  text: string;
  icon?: Icon;
  iconAfter?: Icon;

  theme?: ThemeName | null;

  onPress?: () => void;
}

const isButtonProps = (obj: unknown): obj is ButtonProps => {
  return typeof obj === "object" && (obj as ButtonProps).text !== undefined;
};

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

type VirtualizedListItemProps = (LoadingProps | LoadedProps) & {
  onPress?: () => void;
};

const VirtualizedListItem = (props: VirtualizedListItemProps) => {
  const debouncedOnPress = useMemo(
    () => (props.onPress ? debounce(props.onPress, 300) : undefined),
    [props.onPress],
  );

  const isTwoButtons =
    (props.loading &&
      props.showSkeletons?.button &&
      props.showSkeletons?.button2) ||
    (!props.loading && props.button && props.button2);

  const content = (
    <Skeleton.Group show={props.loading}>
      <XStack alignItems="center" paddingVertical="$2">
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
              <SizableText lineHeight={0}>{props.title}</SizableText>
            ) : null}

            {props.loading && props.showSkeletons?.subtitle ? (
              <Skeleton width={100}>
                <SizableText>Loading...</SizableText>
              </Skeleton>
            ) : !props.loading && props.subtitle ? (
              <SizableText theme="alt1" lineHeight={0}>
                {props.subtitle}
              </SizableText>
            ) : null}

            {props.loading && props.showSkeletons?.subtitle2 ? (
              <Skeleton width={100}>
                <SizableText>Loading...</SizableText>
              </Skeleton>
            ) : !props.loading && props.subtitle2 ? (
              <SizableText theme="alt1" lineHeight={0}>
                {props.subtitle2}
              </SizableText>
            ) : null}
          </YStack>
        </XStack>

        <XStack gap="$2">
          {props.loading && props.showSkeletons?.button ? (
            <Skeleton>
              <Button
                size={isTwoButtons ? "$3.5" : "$3.5"}
                width={isTwoButtons ? 85 : 100}
              >
                Loading...
              </Button>
            </Skeleton>
          ) : !props.loading && props.button ? (
            isButtonProps(props.button) ? (
              <Button
                size={isTwoButtons ? "$3.5" : "$3.5"}
                width={isTwoButtons ? 85 : 100}
                onPress={
                  props.button.onPress
                    ? debounce(props.button.onPress, 300)
                    : undefined
                }
                {...props.button}
              >
                {props.button.text}
              </Button>
            ) : (
              props.button
            )
          ) : null}

          {props.loading && props.showSkeletons?.button2 ? (
            <Skeleton>
              <Button
                size={isTwoButtons ? "$3.5" : "$3.5"}
                width={isTwoButtons ? 85 : 100}
              >
                Loading...
              </Button>
            </Skeleton>
          ) : !props.loading && props.button2 ? (
            isButtonProps(props.button2) ? (
              <Button
                size={isTwoButtons ? "$3.5" : "$3.5"}
                width={isTwoButtons ? 85 : 100}
                onPress={
                  props.button2.onPress
                    ? debounce(props.button2.onPress, 300)
                    : undefined
                }
                {...props.button2}
              >
                {props.button2.text}
              </Button>
            ) : (
              props.button2
            )
          ) : null}
        </XStack>
      </XStack>
    </Skeleton.Group>
  );

  return props.onPress ? (
    <TouchableOpacity onPress={debouncedOnPress} disabled={props.loading}>
      {content}
    </TouchableOpacity>
  ) : (
    content
  );
};

export default VirtualizedListItem;
