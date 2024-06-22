import type { FunctionComponent } from "react";
import React, { useMemo } from "react";
import {
  ImageSourcePropType,
  StyleProp,
  TouchableOpacity,
  View,
} from "react-native";
import debounce from "lodash/debounce";
import { Skeleton } from "moti/skeleton";
import type {
  SizeTokens,
  StackProps,
  ThemeName,
  ViewProps,
  XStackProps,
} from "tamagui";
import {
  Avatar,
  ButtonProps as BaseButtonProps,
  Button,
  SizableText,
  Spacer,
  XStack,
  YStack,
} from "tamagui";

import StatusRenderer from "../StatusRenderer";

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

export interface ButtonProps extends BaseButtonProps {
  text: string;
}

interface LoadedProps {
  loading: false;
  imageUrl?: string | ImageSourcePropType;
  title?: string;
  subtitle?: string;
  subtitle2?: string;
  button?: ButtonProps;
  button2?: ButtonProps;
}

type VirtualizedListItemProps = (LoadingProps | LoadedProps) & {
  onPress?: () => void;
  containerStyle?: ViewProps;
};

interface DefaultButtonProps {
  size: SizeTokens | number;
}

const VirtualizedListItem = (props: VirtualizedListItemProps) => {
  const debouncedOnPress = useMemo(
    () => (props.onPress ? debounce(props.onPress, 300) : undefined),
    [props.onPress],
  );

  const shouldRenderProfilePicture =
    (props.loading && props.showSkeletons?.imageUrl) ||
    (!props.loading && props.imageUrl);

  const shouldRenderTitle =
    (props.loading && props.showSkeletons?.title) ||
    (!props.loading && props.title);

  const shouldRenderSubtitle =
    (props.loading && props.showSkeletons?.subtitle) ||
    (!props.loading && props.subtitle);

  const shouldRenderSubtitle2 =
    (props.loading && props.showSkeletons?.subtitle2) ||
    (!props.loading && props.subtitle2);

  const shouldRenderButton =
    (props.loading && props.showSkeletons?.button) ||
    (!props.loading && props.button);

  const shouldRenderButton2 =
    (props.loading && props.showSkeletons?.button2) ||
    (!props.loading && props.button2);

  const isTwoButtons = shouldRenderButton && shouldRenderButton2;
  const defaultButtonProps = {
    size: isTwoButtons ? "$3.5" : "$3.5",
  } as const satisfies DefaultButtonProps;

  const content = (
    <Skeleton.Group show={props.loading}>
      <XStack
        alignItems="center"
        paddingVertical="$2"
        {...props.containerStyle}
      >
        <XStack flex={1} alignItems="center" gap="$3">
          <View>
            {shouldRenderProfilePicture && (
              <StatusRenderer
                data={
                  !props.loading && props.imageUrl ? props.imageUrl : undefined
                }
                loadingComponent={
                  <Skeleton radius={100}>
                    <Avatar circular size={56} />
                  </Skeleton>
                }
                successComponent={(imageUrl) => (
                  <Avatar circular size={56}>
                    <Avatar.Image
                      source={
                        typeof imageUrl === "string"
                          ? { uri: imageUrl }
                          : imageUrl
                      }
                    />
                  </Avatar>
                )}
              />
            )}
          </View>

          <YStack flex={1}>
            {shouldRenderTitle && (
              <StatusRenderer
                data={!props.loading && props.title ? props.title : undefined}
                loadingComponent={
                  <Skeleton width={75}>
                    <SizableText>Loading...</SizableText>
                  </Skeleton>
                }
                successComponent={(title) => (
                  <SizableText fontWeight="bold" lineHeight={0}>
                    {title}
                  </SizableText>
                )}
              />
            )}

            {props.loading && props.showSkeletons?.subtitle && (
              <Spacer size="$1" />
            )}

            {shouldRenderSubtitle && (
              <StatusRenderer
                data={
                  !props.loading && props.subtitle ? props.subtitle : undefined
                }
                loadingComponent={
                  <Skeleton width={100}>
                    <SizableText>Loading...</SizableText>
                  </Skeleton>
                }
                successComponent={(subtitle) => (
                  <SizableText theme="alt1" size={"$3"} lineHeight={0}>
                    {subtitle}
                  </SizableText>
                )}
              />
            )}

            {props.loading && props.showSkeletons?.subtitle2 && (
              <Spacer size="$1" />
            )}

            {shouldRenderSubtitle2 && (
              <StatusRenderer
                data={
                  !props.loading && props.subtitle2
                    ? props.subtitle2
                    : undefined
                }
                loadingComponent={
                  <Skeleton width={100}>
                    <SizableText>Loading...</SizableText>
                  </Skeleton>
                }
                successComponent={(subtitle2) => (
                  <SizableText theme="alt1" size={"$2"} lineHeight={0}>
                    {subtitle2}
                  </SizableText>
                )}
              />
            )}
          </YStack>

          <XStack gap="$2">
            {shouldRenderButton && (
              <StatusRenderer
                data={!props.loading && props.button ? props.button : undefined}
                loadingComponent={
                  <Skeleton>
                    <Button width={100} {...defaultButtonProps} />
                  </Skeleton>
                }
                successComponent={(customButtonProps) => (
                  <Button
                    {...defaultButtonProps}
                    {...customButtonProps}
                    onPress={
                      customButtonProps.onPress
                        ? debounce(customButtonProps.onPress, 300)
                        : undefined
                    }
                  >
                    {customButtonProps.text}
                  </Button>
                )}
              />
            )}

            {shouldRenderButton2 && (
              <StatusRenderer
                data={
                  !props.loading && props.button2 ? props.button2 : undefined
                }
                loadingComponent={
                  <Skeleton>
                    <Button width={100} {...defaultButtonProps} />
                  </Skeleton>
                }
                successComponent={(customButtonProps) => (
                  <Button
                    {...defaultButtonProps}
                    {...customButtonProps}
                    onPress={
                      customButtonProps.onPress
                        ? debounce(customButtonProps.onPress, 300)
                        : undefined
                    }
                  >
                    {customButtonProps.text}
                  </Button>
                )}
              />
            )}
          </XStack>
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
