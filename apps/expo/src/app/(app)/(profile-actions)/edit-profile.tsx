import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  View as RNView,
  StyleSheet,
} from "react-native";
import { TextInput, TouchableOpacity } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronRight, Minus } from "@tamagui/lucide-icons";
import { Controller, useForm } from "react-hook-form";
import {
  Avatar,
  Button,
  H3,
  Input,
  ScrollView,
  SizableText,
  Stack,
  Text,
  useTheme,
  View,
  XStack,
  YStack,
} from "tamagui";
import { z } from "zod";

import { sharedValidators } from "@oppfy/validators";

import { BaseScreenView } from "~/components/Views";
import { api } from "~/utils/api";

const profileSchema = z.object({
  fullName: sharedValidators.user.fullName,
  username: sharedValidators.user.username,
  bio: sharedValidators.user.bio,
});

type ProfileFields = z.infer<typeof profileSchema>;
type FieldKeys = keyof ProfileFields;

const EditProfile: React.FC = () => {
  const utils = api.useUtils();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const defaultValues = utils.profile.getFullProfileSelf.getData();

  const {
    control,
    setError,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ProfileFields>({
    defaultValues: {
      fullName: defaultValues?.name ?? "",
      username: defaultValues?.username ?? "",
      bio: defaultValues?.bio ?? "",
    },
    resolver: zodResolver(profileSchema),
  });

  const updateProfile = api.profile.updateProfile.useMutation({
    // Mutation Logic
  });

  const onSubmit = handleSubmit(async (data) => {
    await updateProfile.mutateAsync(data, {
      onSuccess: () => bottomSheetRef.current?.close(),
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

  const openBottomSheet = (field: FieldKeys) => {
    setCurrentField(field);
    setInputValue(watch(field));
    bottomSheetRef.current?.expand();
  };

  const clearInput = () => setInputValue("");

  const getCharLimit = (field: FieldKeys): number => {
    const validation = profileSchema.shape[field];
    const maxCheck = validation._def.checks.find(
      (check) => check.kind === "max",
    );
    return maxCheck?.kind === "max" ? maxCheck.value : Infinity;
  };

  const renderHeader = useCallback(
    () => (
      <YStack
        flex={1}
        justifyContent="center"
        alignItems="center"
        position="relative"
      >
        <Minus size="$4" />
        <View justifyContent="center" alignItems="center">
          <SizableText size="$5" textAlign="center" fontWeight="bold">
            Edit {currentField}
          </SizableText>
        </View>
        <View
          width="95%"
          borderColor="$gray8"
          borderWidth="$0.25"
          marginTop="$3"
        />
      </YStack>
    ),
    [currentField],
  );

  const renderFieldContent = useCallback(
    (
      field: FieldKeys,
      title: string,
      placeholder: string,
      description: string,
    ) => {
      const charLimit = getCharLimit(field);
      return (
        <YStack flex={1} padding="$4" space="$4">
          <XStack justifyContent="space-between">
            <Text fontSize="$6" fontWeight="bold">
              {title}
            </Text>
            <XStack alignItems="center" space="$2">
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
            render={({ field: { onBlur } }) => (
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
                  onChangeText={setInputValue}
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
          "Tell us about yourself",
          "Bio",
          "🌟 Share a brief description of who you are or what you're passionate about.",
        );
      default:
        return null;
    }
  }, [currentField, renderFieldContent]);

  return (
    <BaseScreenView>
      <ScrollView>
        <YStack gap="$4">
          <TouchableOpacity>
            <YStack alignItems="center" gap="$3">
              <Avatar size="$12" circular bordered>
                <Avatar.Image src={defaultValues?.profilePictureUrl} />
                <Avatar.Fallback backgroundColor="$blue5" />
              </Avatar>
              <Text color="$blue10">Edit photo</Text>
            </YStack>
          </TouchableOpacity>

          <H3>Profile Details</H3>
          {(["fullName", "username", "bio"] as const).map((field) => (
            <XStack
              key={field}
              justifyContent="space-between"
              alignItems="center"
              onPress={() => openBottomSheet(field)}
            >
              <YStack flex={1}>
                <Text
                  fontSize="$5"
                  fontWeight="500"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {field === "username" ? `@${watch(field)}` : `Add ${field}`}
                </Text>
                <Text color="$gray10">
                  {field === "fullName" ? "Display name" : field}
                </Text>
              </YStack>
              <ChevronRight size={24} color="$gray10" />
            </XStack>
          ))}
        </YStack>
      </ScrollView>

      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={["50%"]}
        index={-1}
        keyboardBlurBehavior="restore"
        enablePanDownToClose
        handleComponent={renderHeader}
        backgroundStyle={{ backgroundColor: theme.gray4.val }}
      >
        {renderBottomSheetContent()}
        <XStack padding="$4" paddingBottom={insets.bottom}>
          <Button flex={1} size="$5" borderRadius="$7" onPress={onSubmit}>
            Save
          </Button>
        </XStack>
      </BottomSheet>
    </BaseScreenView>
  );
};

export default EditProfile;
