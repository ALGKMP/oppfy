import type { ReactNode } from "react";
import React, { useMemo } from "react";
import type { ImageSourcePropType } from "react-native";
import { TouchableOpacity } from "react-native";
import debounce from "lodash/debounce";
import type { ButtonProps as BaseButtonProps, ViewProps } from "tamagui";
import { Avatar, Button, SizableText, Spacer, XStack, YStack } from "tamagui";

import { Skeleton } from "~/components/Skeletons";
import StatusRenderer from "../StatusRenderer";

type ReactElementOrString = ReactNode | string;

interface LoadingProps {
  loading: true;
  showSkeletons?: Partial<Record<keyof Omit<LoadedProps, "loading">, boolean>>;
}

export interface ButtonProps extends BaseButtonProps {
  text: string;
}

interface LoadedProps {
  loading: false;
  imageUrl?: string | ImageSourcePropType;
  title?: ReactElementOrString;
  subtitle?: ReactElementOrString;
  subtitle2?: ReactElementOrString;
  button?: ButtonProps | React.ReactElement;
  button2?: ButtonProps | React.ReactElement;
}

type VirtualizedListItemProps = (LoadingProps | LoadedProps) & {
  onPress?: () => void;
  containerStyle?: ViewProps;
};

type DefaultButtonProps = Partial<Pick<BaseButtonProps, "width" | "size">>;

const isButtonProps = (
  button: ButtonProps | React.ReactNode,
): button is ButtonProps => {
  return button !== null && typeof button === "object" && "text" in button;
};

const renderContent = (
  content: ReactElementOrString,
  defaultProps: object,
): ReactNode => {
  if (React.isValidElement(content)) {
    return content;
  }
  if (typeof content === "string") {
    return <SizableText {...defaultProps}>{content}</SizableText>;
  }
  return null;
};

const VirtualizedListItem = (props: VirtualizedListItemProps) => {
  const debouncedOnPress = useMemo(
    () => props.onPress && debounce(props.onPress, 300),
    [props.onPress],
  );

  const shouldRender = (key: keyof Omit<LoadedProps, "loading">): boolean =>
    (props.loading && !!props.showSkeletons?.[key]) ||
    (!props.loading && !!props[key]);

  const isTwoButtons = shouldRender("button") && shouldRender("button2");
  const defaultButtonProps: DefaultButtonProps = {
    size: isTwoButtons ? "$3.5" : "$3.5",
  };

  const renderButton = (button?: ButtonProps | React.ReactElement) => {
    if (!button) return null;
    if (isButtonProps(button)) {
      return (
        <Button
          {...defaultButtonProps}
          {...button}
          onPress={button.onPress && debounce(button.onPress, 300)}
        >
          {button.text}
        </Button>
      );
    }
    return button;
  };

  const content = (
    <XStack alignItems="center" paddingVertical="$2" {...props.containerStyle}>
      <XStack flex={1} alignItems="center" gap="$3">
        {shouldRender("imageUrl") && (
          <StatusRenderer
            data={!props.loading && props.imageUrl ? props.imageUrl : undefined}
            loadingComponent={<Skeleton circular size={56} />}
            successComponent={(imageUrl) => (
              <Avatar circular size={56}>
                <Avatar.Image
                  source={
                    typeof imageUrl === "string" ? { uri: imageUrl } : imageUrl
                  }
                />
              </Avatar>
            )}
          />
        )}

        <YStack flex={1}>
          {shouldRender("title") && (
            <StatusRenderer
              data={!props.loading && props.title ? props.title : undefined}
              loadingComponent={<Skeleton width={75} height={20} radius={4} />}
              successComponent={(title) =>
                renderContent(title, { fontWeight: "bold", lineHeight: 0 })
              }
            />
          )}

          {shouldRender("subtitle") && (
            <>
              {props.loading && <Spacer size="$1" />}
              <StatusRenderer
                data={
                  !props.loading && props.subtitle ? props.subtitle : undefined
                }
                loadingComponent={
                  <Skeleton width={100} height={18} radius={4} />
                }
                successComponent={(subtitle) =>
                  renderContent(subtitle, {
                    theme: "alt1",
                    size: "$3",
                    lineHeight: 0,
                  })
                }
              />
            </>
          )}

          {shouldRender("subtitle2") && (
            <>
              {props.loading && <Spacer size="$1" />}
              <StatusRenderer
                data={
                  !props.loading && props.subtitle2
                    ? props.subtitle2
                    : undefined
                }
                loadingComponent={
                  <Skeleton width={100} height={16} radius={4} />
                }
                successComponent={(subtitle2) =>
                  renderContent(subtitle2, {
                    theme: "alt1",
                    size: "$2",
                    lineHeight: 0,
                  })
                }
              />
            </>
          )}
        </YStack>

        <XStack gap="$2">
          {shouldRender("button") && (
            <StatusRenderer
              data={!props.loading && props.button ? props.button : undefined}
              loadingComponent={
                <Skeleton
                  width={isTwoButtons ? 85 : 100}
                  height={40}
                  radius={10}
                />
              }
              successComponent={renderButton}
            />
          )}

          {shouldRender("button2") && (
            <StatusRenderer
              data={!props.loading && props.button2 ? props.button2 : undefined}
              loadingComponent={
                <Skeleton
                  width={isTwoButtons ? 85 : 100}
                  height={40}
                  radius={10}
                />
              }
              successComponent={renderButton}
            />
          )}
        </XStack>
      </XStack>
    </XStack>
  );

  return props.onPress ? (
    <TouchableOpacity onPress={debouncedOnPress} disabled={props.loading}>
      {content}
    </TouchableOpacity>
  ) : (
    content
  );
};

export default React.memo(VirtualizedListItem);
