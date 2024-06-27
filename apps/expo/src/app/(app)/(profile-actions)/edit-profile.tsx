import React, { useCallback, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomSheet, { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronRight, Minus, X } from "@tamagui/lucide-icons";
import { Controller, useForm } from "react-hook-form";
import {
  Avatar,
  Button,
  getToken,
  H1,
  H2,
  H3,
  H4,
  H5,
  Header,
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

type FieldKeys = keyof z.infer<typeof profileSchema>;

const EditProfile = () => {
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
  } = useForm({
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
      onError: (error) => {
        if (error.data?.code === "CONFLICT") {
          setError("username", {
            type: "manual",
            message: "Username already taken.",
          });
        }
      },
    });
    bottomSheetRef.current?.close();
  });

  const [currentField, setCurrentField] = useState<FieldKeys | null>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [inputValue, setInputValue] = useState("");

  const openBottomSheet = (field: FieldKeys) => {
    setCurrentField(field);
    setInputValue(watch(field));
    bottomSheetRef.current?.expand();
  };

  const clearInput = () => {
    setInputValue("");
  };

  const getCharLimit = (field: FieldKeys) => {
    const validation = profileSchema.shape[field];
    const checks = validation._def.checks;
    const maxCheck = checks.find((check) => check.kind === "max");
    return maxCheck?.kind === "max" ? maxCheck.value : undefined;
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

  const renderFullNameContent = useCallback(() => {
    const charLimit = getCharLimit("fullName");
    return (
      <YStack flex={1} padding="$4" space="$4">
        <Text fontSize="$6" fontWeight="bold">
          What's your name?
        </Text>
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onBlur } }) => (
            <BottomSheetTextInput
              placeholder="Full Name"
              onBlur={onBlur}
              value={inputValue}
              onChangeText={setInputValue}
              style={{
                fontWeight: "bold",
                justifyContent: "flex-start",
                borderColor: "#2E2E2E",
                borderRadius: 20,
                backgroundColor: "#2E2E2E",
                color: "#fff",
                padding: 20,
              }}
              maxLength={charLimit}
            />
          )}
        />
        {errors.fullName && (
          <Text color="$red9">{errors.fullName.message}</Text>
        )}
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$3" color="$gray10">
            {inputValue.length}/{charLimit}
          </Text>
          <TouchableOpacity onPress={clearInput}>
            <X color="$red8" size={24} />
          </TouchableOpacity>
        </XStack>
        <XStack gap="$2">
          {[`"${inputValue}"`, `${inputValue}'s`, inputValue].map(
            (suggestion, index) => (
              <Button key={index} onPress={() => setInputValue(suggestion)}>
                {suggestion}
              </Button>
            ),
          )}
        </XStack>
      </YStack>
    );
  }, [control, errors, inputValue]);

  const renderUsernameContent = useCallback(() => {
    const maxCheck = profileSchema.shape.bio._def.checks.find(
      (check) => check.kind === "max",
    );
    const charLimit = maxCheck?.kind === "max" ? maxCheck.value : undefined;

    return (
      <YStack flex={1} padding="$4" gap="$4">
        <Text fontSize="$6" fontWeight="bold">
          Choose your username
        </Text>
        <Controller
          control={control}
          name="username"
          render={({ field: { onBlur } }) => (
            <BottomSheetTextInput
              placeholder="Username"
              onBlur={onBlur}
              value={inputValue}
              onChangeText={setInputValue}
              style={{
                fontWeight: "bold",
                justifyContent: "flex-start",
                borderColor: "#2E2E2E",
                borderRadius: 20,
                backgroundColor: "#2E2E2E",
                color: "#fff",
                padding: 20,
              }}
              maxLength={charLimit}
            />
          )}
        />
        {errors.username && (
          <Text color="$red9">{errors.username.message}</Text>
        )}
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$3" color="$gray10">
            {inputValue.length}/{charLimit}
          </Text>
          <TouchableOpacity onPress={clearInput}>
            <X color={"$red9"} size={24} />
          </TouchableOpacity>
        </XStack>
      </YStack>
    );
  }, [control, errors, inputValue]);

  const renderBioContent = useCallback(() => {
    const charLimit = getCharLimit("bio");
    return (
      <YStack flex={1} padding="$4" space="$4">
        <Text fontSize="$6" fontWeight="bold">
          Tell us about yourself
        </Text>
        <Controller
          control={control}
          name="bio"
          render={({ field: { onBlur } }) => (
            <BottomSheetTextInput
              placeholder="Bio"
              onBlur={onBlur}
              value={inputValue}
              onChangeText={setInputValue}
              multiline={true}
              style={{
                fontWeight: "bold",
                justifyContent: "flex-start",
                borderColor: "#2E2E2E",
                borderRadius: 20,
                backgroundColor: "#2E2E2E",
                color: "#fff",
                padding: 20,
              }}
              maxLength={charLimit}
            />
          )}
        />
        {errors.bio && <Text color="$red9">{errors.bio.message}</Text>}
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$3" color="$gray10">
            {inputValue.length}/{charLimit}
          </Text>
          <TouchableOpacity onPress={clearInput}>
            <X color="$red8" size={24} />
          </TouchableOpacity>
        </XStack>
      </YStack>
    );
  }, [control, errors, inputValue]);

  const renderBottomSheetContent = useCallback(() => {
    switch (currentField) {
      case "fullName":
        return renderFullNameContent();
      case "username":
        return renderUsernameContent();
      case "bio":
        return renderBioContent();
    }
  }, [
    currentField,
    renderFullNameContent,
    renderUsernameContent,
    renderBioContent,
  ]);

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

          {/* <Text fontSize="$6" fontWeight="bold">
            Journal
          </Text> */}
          <H3>Profile Details</H3>
          <XStack
            justifyContent="space-between"
            alignItems="center"
            onPress={() => openBottomSheet("fullName")}
          >
            <YStack>
              <Text fontSize="$5" fontWeight="500">
                {defaultValues?.name}
              </Text>
              <Text color="$gray10">Display name</Text>
            </YStack>
            <ChevronRight size={24} color="$gray10" />
          </XStack>
          <XStack
            justifyContent="space-between"
            alignItems="center"
            onPress={() => openBottomSheet("username")}
          >
            <YStack>
              <Text fontSize="$5" fontWeight="500">
                @{defaultValues?.username}
              </Text>
              <Text color="$gray10">Username</Text>
            </YStack>
            <ChevronRight size={24} color="$gray10" />
          </XStack>
          <XStack
            justifyContent="space-between"
            alignItems="center"
            onPress={() => openBottomSheet("bio")}
          >
            <YStack flex={1}>
              <Text
                fontSize="$5"
                fontWeight="500"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {defaultValues?.bio ?? "Add a bio"}
              </Text>
              <Text color="$gray10">Bio</Text>
            </YStack>
            <ChevronRight size={24} color="$gray10" />
          </XStack>
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
