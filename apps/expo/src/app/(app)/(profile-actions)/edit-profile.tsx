import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  Button,
  Input,
  SizableText,
  Spinner,
  Text,
  TextArea,
  XStack,
  YStack,
} from "tamagui";
import { z } from "zod";

import { sharedValidators } from "@acme/validators";

import { KeyboardSafeView } from "~/components/SafeViews";
import { BaseScreenView } from "~/components/Views";
import { api } from "~/utils/api";

const profileSchema = z.object({
  name: sharedValidators.user.fullName,
  username: sharedValidators.user.username,
  bio: sharedValidators.user.bio,
});

const EditProfile = () => {
  const utils = api.useUtils();

  const defaultValues = utils.profile.getCurrentUsersFullProfile.getData();

  const {
    control,
    setError,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    defaultValues: {
      name: defaultValues?.name ?? "",
      username: defaultValues?.username ?? "",
      bio: defaultValues?.bio ?? "",
    },
    resolver: zodResolver(profileSchema),
  });

  const updateProfile = api.profile.updateProfile.useMutation({
    onMutate: async (newPartialProfileData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.profile.getCurrentUsersFullProfile.cancel();

      // Get the data from the queryCache
      const prevData = utils.profile.getCurrentUsersFullProfile.getData();
      if (prevData === undefined) return;

      // Optimistically update the data
      utils.profile.getCurrentUsersFullProfile.setData(undefined, {
        ...prevData,
        ...newPartialProfileData,
      });

      // Return the previous data so we can revert if something goes wrong
      return { prevData };
    },
    onError: (_err, _newPartialProfileData, ctx) => {
      if (ctx === undefined) return;

      // If the mutation fails, use the context-value from onMutate
      utils.profile.getCurrentUsersFullProfile.setData(undefined, ctx.prevData);
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      await utils.profile.getCurrentUsersFullProfile.invalidate();
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    await updateProfile.mutateAsync(data, {
      onError(error) {
        switch (error.data?.code) {
          case "CONFLICT": {
            setError("username", {
              type: "manual",
              message: "Username already taken.",
            });
          }
        }
      },
    });
  });

  return (
    <KeyboardSafeView>
      <BaseScreenView>
        <YStack flex={1} gap="$4">
          <XStack alignItems="flex-start" gap="$4">
            <SizableText width="$7">Name</SizableText>
            <YStack flex={1} gap="$2">
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder="Name"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    borderColor={errors.name ? "$red9" : undefined}
                  />
                )}
              />
              {errors.name && <Text color="$red9">{errors.name.message}</Text>}
            </YStack>
          </XStack>

          <XStack alignItems="flex-start" gap="$4">
            <SizableText width="$7">Username</SizableText>
            <YStack flex={1} gap="$2">
              <Controller
                control={control}
                name="username"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder="Username"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    borderColor={errors.username ? "$red9" : undefined}
                  />
                )}
              />
              {errors.username && (
                <Text color="$red9">{errors.username.message}</Text>
              )}
            </YStack>
          </XStack>

          <XStack alignItems="flex-start" gap="$2">
            <SizableText width="$4">Bio</SizableText>
            <YStack flex={1} gap="$2">
              <Controller
                control={control}
                name="bio"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextArea
                    placeholder="Bio"
                    minHeight="$8"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    borderColor={errors.bio ? "$red9" : undefined}
                  />
                )}
              />
              {errors.bio && <Text color="$red9">{errors.bio.message}</Text>}
            </YStack>
          </XStack>
        </YStack>

        <Button
          onPress={onSubmit}
          disabled={!isDirty}
          disabledStyle={{
            opacity: 0.5,
          }}
        >
          {isSubmitting ? <Spinner /> : "Save"}
        </Button>
      </BaseScreenView>
    </KeyboardSafeView>
  );
};

export default EditProfile;
