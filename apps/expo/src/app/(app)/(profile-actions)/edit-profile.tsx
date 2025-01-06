import React, { useEffect, useRef, useState } from "react";
import type { TextInput } from "react-native-gesture-handler";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import DefaultProfilePicture from "@assets/default-profile-picture.jpg";
import { Ionicons } from "@expo/vector-icons";
import Feather from "@expo/vector-icons/Feather";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { useTheme } from "tamagui";

import CardContainer from "~/components/Containers/CardContainer";
import {
  Button,
  H5,
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

/* -----------------------------
   Titles/placeholders for fields
------------------------------ */
const FIELD_TITLES = {
  name: "Edit Name",
  username: "Edit Username",
  bio: "Edit Bio",
} as const;

const FIELD_PLACEHOLDERS = {
  name: "Full Name",
  username: "Your username",
  bio: "Your bio",
} as const;

/**
 * A generic bottom-sheet component for editing a single field.
 * Once the user presses "Save," we'll immediately call your API to update that field,
 * and show a spinner while the request is in flight.
 */
const ProfileFieldSheet = ({
  fieldKey,
  initialValue,
  onSave,
  maxLength = 100,
  isMutating,
}: {
  fieldKey: "name" | "username" | "bio";
  initialValue: string;
  onSave: (text: string) => void;
  maxLength?: number;
  isMutating: boolean;
}) => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  // local text input state
  const [localValue, setLocalValue] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ref for the text input to auto-focus
  const inputRef = useRef<TextInput>(null);

  // Auto-focus the text input after the sheet shows
  useEffect(() => {
    const timeout = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timeout);
  }, []);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await onSave(localValue);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isSubmitting || isMutating;

  return (
    <YStack flex={1}>
      <YStack flex={1} padding="$4" gap="$4">
        {/* Title + char counter + clear icon */}
        <XStack justifyContent="space-between">
          <Text fontSize="$6" fontWeight="bold">
            {FIELD_TITLES[fieldKey] ?? "Edit Field"}
          </Text>
          <XStack alignItems="center" gap="$2">
            <Text fontSize="$3" color="$gray10">
              {localValue.length}/{maxLength}
            </Text>
            <TouchableOpacity onPress={() => setLocalValue("")}>
              <Ionicons name="close-circle" size={20} color={theme.gray8.val} />
            </TouchableOpacity>
          </XStack>
        </XStack>

        {/* Text input */}
        <BottomSheetTextInput
          ref={inputRef}
          placeholder={FIELD_PLACEHOLDERS[fieldKey] ?? "Type here..."}
          value={localValue}
          onChangeText={setLocalValue}
          multiline={fieldKey === "bio"}
          maxLength={maxLength}
          autoCapitalize={fieldKey === "username" ? "none" : "words"}
          autoCorrect={fieldKey === "username" ? false : true}
          style={{
            fontWeight: "bold",
            justifyContent: "flex-start",
            color: theme.color.val,
            backgroundColor: theme.gray5.val,
            padding: 20,
            borderRadius: 20,
          }}
        />
      </YStack>

      {/* Save button */}
      <XStack padding="$4" paddingBottom={insets.bottom}>
        <Button
          flex={1}
          size="$5"
          borderRadius="$7"
          disabled={localValue === initialValue || isLoading}
          onPress={handleSave}
        >
          {isLoading ? <Spinner size="small" color="$color" /> : "Save"}
        </Button>
      </XStack>
    </YStack>
  );
};

const EditProfile = () => {
  const theme = useTheme();
  const { pickAndUploadImage } = useUploadProfilePicture({
    optimisticallyUpdate: true,
  });
  const { show, hide } = useBottomSheetController();

  /* -------------------------------------------
     Pull the user's existing data from the cache
  -------------------------------------------- */
  const utils = api.useUtils();
  const defaultValues = utils.profile.getFullProfileSelf.getData();

  // Locally track the user's profile fields
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [username, setUsername] = useState(defaultValues?.username ?? "");
  const [bio, setBio] = useState(defaultValues?.bio ?? "");

  /* ---------------------------------------------
     Mutation to update the profile in real-time
  ---------------------------------------------- */
  const updateProfile = api.profile.updateProfile.useMutation({
    onMutate: async (newData) => {
      await utils.profile.getFullProfileSelf.cancel();
      const prevData = utils.profile.getFullProfileSelf.getData();
      if (prevData) {
        utils.profile.getFullProfileSelf.setData(undefined, {
          ...prevData,
          ...newData,
        });
      }
      return { prevData };
    },
    onError: (_err, _newData, ctx) => {
      if (ctx?.prevData) {
        utils.profile.getFullProfileSelf.setData(undefined, ctx.prevData);
      }
    },
    onSettled: async () => {
      await utils.profile.getFullProfileSelf.invalidate();
    },
  });

  // is the update mutation currently running
  const isMutating = updateProfile.isPending;

  /**
   * Open the bottom sheet for a particular field (name, username, or bio).
   * Once the user hits "Save," we do an immediate profile update,
   * showing a spinner in place of the "Save" text while requesting.
   */
  const openFieldSheet = (field: "name" | "username" | "bio") => {
    const currentValue =
      field === "name" ? name : field === "username" ? username : bio;
    const maxLength = field === "bio" ? 255 : 50; // example maximum

    show({
      title: FIELD_TITLES[field],
      children: (
        <ProfileFieldSheet
          fieldKey={field}
          initialValue={currentValue}
          maxLength={maxLength}
          isMutating={isMutating}
          onSave={async (newValue) => {
            // Immediately update local states
            let dataToUpdate = {
              name,
              username,
              bio,
            };

            if (field === "name") {
              setName(newValue);
              dataToUpdate.name = newValue;
            }
            if (field === "username") {
              setUsername(newValue.toLowerCase());
              dataToUpdate.username = newValue.toLowerCase();
            }
            if (field === "bio") {
              setBio(newValue);
              dataToUpdate.bio = newValue;
            }

            try {
              // Show a spinner while updating
              await updateProfile.mutateAsync(dataToUpdate);
            } catch (error) {
              // handle error if needed
            } finally {
              hide();
            }
          }}
        />
      ),
    });
  };

  return (
    <ScreenView scrollable safeAreaEdges={["bottom"]}>
      <YStack gap="$5">
        {/* ---------------------------------------
            Edit Profile Picture 
        --------------------------------------- */}
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

        {/* ---------------------------------------
            Card for main profile fields
        --------------------------------------- */}
        <CardContainer padding="$4">
          <YStack gap="$4">
            <H5>Profile Information</H5>

            {/* Name */}
            <XStack
              justifyContent="space-between"
              alignItems="center"
              onPress={() => openFieldSheet("name")}
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
                    {name || "Add name"}
                  </Text>
                  <Text color="$gray10">Name</Text>
                </YStack>
              </XStack>
              <Ionicons
                name="chevron-forward"
                size={24}
                color={theme.gray10.val}
              />
            </XStack>
            <Separator />

            {/* Username */}
            <XStack
              justifyContent="space-between"
              alignItems="center"
              onPress={() => openFieldSheet("username")}
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
                    {username || "Add username"}
                  </Text>
                  <Text color="$gray10">Username</Text>
                </YStack>
              </XStack>
              <Ionicons
                name="chevron-forward"
                size={24}
                color={theme.gray10.val}
              />
            </XStack>
            <Separator />

            {/* Bio */}
            <XStack
              justifyContent="space-between"
              alignItems="center"
              onPress={() => openFieldSheet("bio")}
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
                    {bio ? "Edit bio" : "Add bio"}
                  </Text>
                  {bio ? (
                    <Text
                      color="$gray10"
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {bio}
                    </Text>
                  ) : null}
                </YStack>
              </XStack>
              <Ionicons
                name="chevron-forward"
                size={24}
                color={theme.gray10.val}
              />
            </XStack>
          </YStack>
        </CardContainer>
      </YStack>
    </ScreenView>
  );
};

export default EditProfile;
