import React, { useCallback, useRef, useState } from "react";
import { View as RNView } from "react-native";
import type { TextInput } from "react-native-gesture-handler";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import DefaultProfilePicture from "@assets/default-profile-picture.jpg";
import { Ionicons } from "@expo/vector-icons";
import Feather from "@expo/vector-icons/Feather";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronRight, Minus } from "@tamagui/lucide-icons";
import { Controller, useForm } from "react-hook-form";
import {
  Button,
  H3,
  ScrollView,
  Separator,
  SizableText,
  Text,
  useTheme,
  View,
  XStack,
  YStack,
} from "tamagui";
import { z } from "zod";

import { sharedValidators } from "@oppfy/validators";

import CardContainer from "~/components/Containers/CardContainer";
import { BaseScreenView } from "~/components/Views";
import { useUploadProfilePicture } from "~/hooks/media";
import { api } from "~/utils/api";

const profileSchema = z.object({
  fullName: sharedValidators.user.fullName,
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
      fullName: defaultValues?.name ?? "",
      username: defaultValues?.username ?? "",
      bio: defaultValues?.bio ?? "",
    },
    resolver: zodResolver(profileSchema),
  });

  const updateProfile = api.profile.updateProfile.useMutation({
    onMutate: async (newPartialProfileData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.profile.getFullProfileSelf.cancel();

      // Get the data from the queryCache
      const prevData = utils.profile.getFullProfileSelf.getData();
      if (prevData === undefined) return;

      // Optimistically update the data
      utils.profile.getFullProfileSelf.setData(undefined, {
        ...prevData,
        ...newPartialProfileData,
      });

      // Return the previous data so we can revert if something goes wrong
      return { prevData };
    },
    onError: (_err, _newPartialProfileData, ctx) => {
      if (ctx === undefined) return;

      // If the mutation fails, use the context-value from onMutate
      utils.profile.getFullProfileSelf.setData(undefined, ctx.prevData);
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      await utils.profile.getFullProfileSelf.invalidate();
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    await updateProfile.mutateAsync(data, {
      onSuccess: () => {
        bottomSheetRef.current?.close();
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

  const [currentField, setCurrentField] = useState<FieldKeys | null>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const inputRef = useRef<TextInput>(null);
  const [inputValue, setInputValue] = useState("");
  const [isFieldChanged, setIsFieldChanged] = useState(false);

  const openBottomSheet = (field: FieldKeys) => {
    setCurrentField(field);
    setInputValue(watch(field));
    setIsFieldChanged(false);
    bottomSheetRef.current?.expand();
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

  const renderHeader = useCallback(() => {
    return (
      <YStack
        flex={1}
        justifyContent="center"
        alignItems="center"
        position="relative"
      >
        <Minus size="$4" />
        <View justifyContent="center" alignItems="center">
          <SizableText size="$5" textAlign="center" fontWeight="bold">
            {currentField === "fullName" && "Edit Name"}
            {currentField === "username" && "Edit Username"}
            {currentField === "bio" && "Edit Bio"}
          </SizableText>
        </View>
        <View
          width="95%"
          borderColor="$gray8"
          borderWidth="$0.25"
          marginTop="$3"
        />
      </YStack>
    );
  }, [currentField]);

  const renderFieldContent = useCallback(
    (
      field: FieldKeys,
      title: string,
      placeholder: string,
      description: string,
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
                {inputValue.length}/{charLimit}
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
                  value={inputValue}
                  onChangeText={(text) => {
                    setInputValue(text);
                    setIsFieldChanged(text !== value);
                  }}
                  multiline={field === "bio"}
                  maxLength={charLimit}
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
        </YStack>
      );
    },
    [control, errors, inputValue, theme],
  );

  const renderBottomSheetContent = useCallback(() => {
    switch (currentField) {
      case "fullName":
        return renderFieldContent(
          "fullName",
          "What's your name?",
          "Full Name",
          "✨ Your display name helps others recognize you.",
        );
      case "username":
        return renderFieldContent(
          "username",
          "Choose your username",
          "Username",
          "🔗 Your unique identifier for mentions and sharing.",
        );
      case "bio":
        return renderFieldContent(
          "bio",
          "About you",
          "Bio",
          "🌟 Share a brief description of who you are or what you're passionate about.",
        );
      default:
        return null;
    }
  }, [currentField, renderFieldContent]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.5}
        {...props}
      />
    ),
    [],
  );

  const handleSave = async () => {
    if (currentField && isFieldChanged) {
      setValue(currentField, inputValue);
      await onSubmit();
    }
  };

  const handleSheetClose = () => {
    setCurrentField(null);
    setInputValue("");
    setIsFieldChanged(false);
  };

  return (
    <BaseScreenView>
      <ScrollView>
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
                onPress={() => openBottomSheet("fullName")}
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
                      {watch("fullName") || "Add name"}
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
      </ScrollView>

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={["50%"]}
        enablePanDownToClose
        keyboardBlurBehavior="restore"
        onClose={handleSheetClose}
        handleComponent={renderHeader}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: theme.gray4.val }}
      >
        {renderBottomSheetContent()}
        <XStack padding="$4" paddingBottom={insets.bottom}>
          <Button
            flex={1}
            size="$5"
            borderRadius="$7"
            onPress={handleSave}
            disabled={!isFieldChanged}
            opacity={isFieldChanged ? 1 : 0.5}
          >
            Save
          </Button>
        </XStack>
      </BottomSheet>
    </BaseScreenView>
  );
};

export default EditProfile;
