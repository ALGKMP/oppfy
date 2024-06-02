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

import { sharedValidators } from "@oppfy/validators";

import { BaseScreenView, KeyboardSafeView } from "~/components/Views";
import { api } from "~/utils/api";

const profileSchema = z.object({
  fullName: sharedValidators.user.fullName,
  username: sharedValidators.user.username,
  bio: sharedValidators.user.bio,
});

const EditProfile = () => {
  const utils = api.useUtils();

  const defaultValues = utils.profile.getFullProfileSelf.getData();

  const {
    control,
    setError,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
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
      <BaseScreenView safeAreaEdges={["bottom"]}>
        <YStack flex={1} gap="$4">
          <YStack gap="$2">
            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  width={"50%"}
                  placeholder="Full Name"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  borderColor={errors.fullName ? "$red9" : undefined}
                />
              )}
            />
            {errors.fullName && (
              <Text color="$red9">{errors.fullName.message}</Text>
            )}
          </YStack>

          <YStack gap="$2">
            <Controller
              control={control}
              name="username"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  width={"50%"}
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

          <YStack flex={1} gap="$2">
            <Controller
              control={control}
              name="bio"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextArea
                  placeholder="Bio"
                  minHeight="$10"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  borderColor={errors.bio ? "$red9" : undefined}
                />
              )}
            />
            {errors.bio && <Text color="$red9">{errors.bio.message}</Text>}
          </YStack>
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
