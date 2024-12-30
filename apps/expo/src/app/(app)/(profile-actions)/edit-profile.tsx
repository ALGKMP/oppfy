import React, { useCallback, useRef, useState } from "react";
import { View as RNView } from "react-native";
import type { TextInput } from "react-native-gesture-handler";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import DefaultProfilePicture from "@assets/default-profile-picture.jpg";
import { Ionicons } from "@expo/vector-icons";
import Feather from "@expo/vector-icons/Feather";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronRight } from "@tamagui/lucide-icons";
import { Controller, useForm } from "react-hook-form";
import { useTheme } from "tamagui";
import { z } from "zod";

import { sharedValidators } from "@oppfy/validators";

import CardContainer from "~/components/Containers/CardContainer";
import {
  Button,
  H3,
  ScreenView,
  Separator,
  Spinner,
  Text,
  View,
  XStack,
  YStack,
} from "~/components/ui";
import { useBottomSheetController } from "~/components/ui/BottomSheet";
import { useUploadProfilePicture } from "~/hooks/media";
import { api } from "~/utils/api";

const profileSchema = z.object({
  name: sharedValidators.user.name,
  username: sharedValidators.user.username,
  bio: sharedValidators.user.bio,
});

type ProfileFields = z.infer<typeof profileSchema>;
type FieldKeys = keyof ProfileFields;

const EditProfile = () => {
  const utils = api.useUtils();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const defaultValues = utils.profile.getFullProfileSelf.getData();
  const { show: showBottomSheet, hide: hideBottomSheet } =
    useBottomSheetController();

  const { pickAndUploadImage } = useUploadProfilePicture({
    optimisticallyUpdate: true,
  });

  const {
    control,
    setError,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<ProfileFields>({
    defaultValues: {
      name: defaultValues?.name ?? "",
      username: defaultValues?.username ?? "",
      bio: defaultValues?.bio ?? "",
    },
    resolver: zodResolver(profileSchema),
  });

  const updateProfile = api.profile.updateProfile.useMutation({
    onMutate: async (newPartialProfileData) => {
      await utils.profile.getFullProfileSelf.cancel();
      const prevData = utils.profile.getFullProfileSelf.getData();
      if (prevData === undefined) return;
      utils.profile.getFullProfileSelf.setData(undefined, {
        ...prevData,
        ...newPartialProfileData,
      });
      return { prevData };
    },
    onError: (_err, _newPartialProfileData, ctx) => {
      if (ctx === undefined) return;
      utils.profile.getFullProfileSelf.setData(undefined, ctx.prevData);
    },
    onSettled: async () => {
      await utils.profile.getFullProfileSelf.invalidate();
    },
  });

  const [currentField, setCurrentField] = useState<FieldKeys | null>(null);
  const inputRef = useRef<TextInput>(null);
  const [inputValue, setInputValue] = useState("");
  const [isFieldChanged, setIsFieldChanged] = useState(false);

  const onSubmit = handleSubmit(async (data) => {
    await updateProfile.mutateAsync(data, {
      onSuccess: () => {
        hideBottomSheet();
        reset(data);
      },
      onError: (error) => {
        if (error.data?.code === "CONFLICT") {
          setError("username", {
            type: "manual",
            message: "Username already taken.",
          });
        }
      },
    });
  });

  const openBottomSheet = (field: FieldKeys) => {
    const currentValue = watch(field);

    setCurrentField(field);
    setInputValue(currentValue);
    setIsFieldChanged(false);

    const title =
      field === "name"
        ? "Edit Name"
        : field === "username"
          ? "Edit Username"
          : "Edit Bio";

    const content =
      field === "name"
        ? renderFieldContent(
            "name",
            "What's your name?",
            "Full Name",
            "✨ Your display name helps others recognize you.",
            currentValue,
          )
        : field === "username"
          ? renderFieldContent(
              "username",
              "Choose your username",
              "Username",
              "🔗 Your unique identifier for mentions and sharing.",
              currentValue,
            )
          : renderFieldContent(
              "bio",
              "About you",
              "Bio",
              "🌟 Share a brief description of who you are or what you're passionate about.",
              currentValue,
            );

    showBottomSheet({
      snapPoints: ["60%"],
      title,
      children: content,
      onDismiss: () => {
        setCurrentField(null);
        setInputValue("");
        setIsFieldChanged(false);
      },
    });
  };

  const clearInput = () => {
    setInputValue("");
    setIsFieldChanged(true);
  };

  const getCharLimit = (field: FieldKeys): number => {
    const validation = profileSchema.shape[field];
    const maxCheck = validation._def.checks.find(
      (check) => check.kind === "max",
    );
    return maxCheck?.kind === "max" ? maxCheck.value : Infinity;
  };

  const renderFieldContent = useCallback(
    (
      field: FieldKeys,
      title: string,
      placeholder: string,
      description: string,
      initialValue: string,
    ) => {
      const charLimit = getCharLimit(field);
      return (
        <YStack flex={1} padding="$4" gap="$4">
          <XStack justifyContent="space-between">
            <Text fontSize="$6" fontWeight="bold">
              {title}
            </Text>
            <XStack alignItems="center" gap="$2">
              <Text fontSize="$3" color="$gray10">
                {initialValue.length}/{charLimit}
              </Text>
              <TouchableOpacity onPress={clearInput}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={theme.gray8.val}
                />
              </TouchableOpacity>
            </XStack>
          </XStack>
          <Controller
            control={control}
            name={field}
            render={({ field: { onBlur, value } }) => (
              <RNView
                onLayout={() => {
                  if (inputRef.current) {
                    inputRef.current.focus();
                  }
                }}
              >
                <BottomSheetTextInput
                  ref={inputRef}
                  autoFocus
                  placeholder={placeholder}
                  onBlur={onBlur}
                  value={initialValue}
                  onChangeText={(text) => {
                    const processedText =
                      field === "username" ? text.replace(/\s/g, "_") : text;

                    setInputValue(processedText);
                    setIsFieldChanged(processedText !== value);
                  }}
                  multiline={field === "bio"}
                  maxLength={charLimit}
                  autoCorrect={field === "username" ? false : true}
                  autoCapitalize={field === "username" ? "none" : "words"}
                  style={{
                    fontWeight: "bold",
                    justifyContent: "flex-start",
                    color: theme.color.val,
                    backgroundColor: theme.gray5.val,
                    padding: 20,
                    borderRadius: 20,
                  }}
                />
              </RNView>
            )}
          />
          <Text fontSize="$3" color="$gray10">
            {description}
          </Text>
          {errors[field] && <Text color="$red8">{errors[field]?.message}</Text>}
          <XStack padding="$4" paddingBottom={insets.bottom}>
            <Button
              flex={1}
              onPress={handleSave}
              disabled={!isFieldChanged || updateProfile.isPending}
            >
              {updateProfile.isPending ? (
                <Spinner size="small" color="$color" />
              ) : (
                "Save"
              )}
            </Button>
          </XStack>
        </YStack>
      );
    },
    [
      control,
      errors,
      theme,
      insets.bottom,
      isFieldChanged,
      updateProfile.isPending,
    ],
  );

  const handleSave = async () => {
    if (currentField && isFieldChanged) {
      const valueToSave =
        currentField === "username" ? inputValue.toLowerCase() : inputValue;

      setValue(currentField, valueToSave);
      await onSubmit();
    }
  };

  return (
    <ScreenView scrollable>
      <YStack gap="$5">
        <TouchableOpacity onPress={pickAndUploadImage}>
          <YStack alignItems="center" gap="$3">
            <View position="relative">
              <Image
                source={
                  defaultValues?.profilePictureUrl ?? DefaultProfilePicture
                }
                style={{
                  width: 160,
                  height: 160,
                  borderRadius: 80,
                  borderColor: "#F214FF",
                  borderWidth: 2,
                }}
              />
              <View
                position="absolute"
                bottom={0}
                right={0}
                borderRadius={40}
                borderWidth="$2"
                borderColor={theme.background.val}
                backgroundColor="$gray5"
                padding="$2"
              >
                <Feather name="edit-3" size={24} color={theme.blue9.val} />
              </View>
            </View>
            <Text color="$blue10">Edit photo</Text>
          </YStack>
        </TouchableOpacity>
        <CardContainer>
          <YStack gap="$4">
            <H3>Profile Information</H3>

            <XStack
              justifyContent="space-between"
              alignItems="center"
              onPress={() => openBottomSheet("name")}
            >
              <XStack flex={1} alignItems="center" gap="$3">
                <Ionicons
                  name="person-outline"
                  size={24}
                  color={theme.gray10.val}
                />
                <YStack>
                  <Text
                    fontSize="$5"
                    fontWeight="500"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {watch("name") || "Add name"}
                  </Text>
                  <Text color="$gray10">Name</Text>
                </YStack>
              </XStack>
              <ChevronRight size={24} color="$gray10" />
            </XStack>
            <Separator />

            <XStack
              justifyContent="space-between"
              alignItems="center"
              onPress={() => openBottomSheet("username")}
            >
              <XStack flex={1} alignItems="center" gap="$3">
                <Ionicons
                  name="at-outline"
                  size={24}
                  color={theme.gray10.val}
                />
                <YStack>
                  <Text
                    fontSize="$5"
                    fontWeight="500"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {watch("username")}
                  </Text>
                  <Text color="$gray10">Username</Text>
                </YStack>
              </XStack>
              <ChevronRight size={24} color="$gray10" />
            </XStack>
            <Separator />

            <XStack
              paddingBottom="$2"
              justifyContent="space-between"
              alignItems="center"
              onPress={() => openBottomSheet("bio")}
            >
              <XStack flex={1} alignItems="center" gap="$3">
                <Ionicons
                  name="information-circle-outline"
                  size={24}
                  color={theme.gray10.val}
                />
                <YStack>
                  <Text
                    fontSize="$5"
                    fontWeight="500"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {watch("bio") ? "Edit bio" : "Add bio"}
                  </Text>
                </YStack>
              </XStack>
              <ChevronRight size={24} color="$gray10" />
            </XStack>
          </YStack>
        </CardContainer>
      </YStack>
    </ScreenView>
  );
};

export default EditProfile;
