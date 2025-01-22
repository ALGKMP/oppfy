import React, { useEffect, useRef, useState } from "react";
import { DimensionValue } from "react-native";
import type { TextInput } from "react-native-gesture-handler";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import DefaultProfilePicture from "@assets/default-profile-picture.jpg";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { BookLock, ChevronRight } from "@tamagui/lucide-icons";
import { getToken, useTheme } from "tamagui";

import { sharedValidators } from "@oppfy/validators";

import {
  Button,
  CardContainer,
  HeaderTitle,
  ScreenView,
  Separator,
  Spinner,
  Switch,
  Text,
  View,
  XStack,
  YStack,
} from "~/components/ui";
import { useBottomSheetController } from "~/components/ui/BottomSheet";
import { useUploadProfilePicture } from "~/hooks/media";
import { usePrivacySettings } from "~/hooks/usePrivacySettings";
import { api } from "~/utils/api";

// Sheet components for each editable field
const NameSheet = ({
  initialValue,
  onSave,
  isMutating,
}: {
  initialValue: string;
  onSave: (value: string) => Promise<void>;
  isMutating: boolean;
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [value, setValue] = useState(initialValue ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = (val: string) => {
    try {
      sharedValidators.user.name.parse(val);
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSave = async () => {
    if (isSubmitting || isMutating) return;
    setIsSubmitting(true);
    try {
      await onSave(value);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isSubmitting || isMutating;

  return (
    <YStack flex={1}>
      <YStack flex={1} padding="$4" gap="$4">
        <XStack justifyContent="space-between">
          <Text fontSize="$6" fontWeight="bold">
            Edit Name
          </Text>
          <XStack alignItems="center" gap="$2">
            <Text fontSize="$3" color="$gray10">
              {value.length}/24
            </Text>
            <TouchableOpacity onPress={() => setValue("")}>
              <Ionicons name="close-circle" size={20} color={theme.gray8.val} />
            </TouchableOpacity>
          </XStack>
        </XStack>

        <BottomSheetTextInput
          ref={inputRef}
          placeholder="Your name"
          value={value}
          onChangeText={setValue}
          maxLength={24}
          autoCapitalize="words"
          style={{
            fontWeight: "bold",
            color: theme.color.val,
            backgroundColor: theme.gray5.val,
            padding: getToken("$4", "space") as DimensionValue,
            borderRadius: getToken("$6", "radius") as string,
          }}
        />
      </YStack>

      <XStack padding="$4" paddingBottom={insets.bottom}>
        <Button
          flex={1}
          variant="primary"
          disabled={value === initialValue || isLoading || !isValid(value)}
          onPress={handleSave}
        >
          {isLoading ? <Spinner size="small" color="$color" /> : "Save"}
        </Button>
      </XStack>
    </YStack>
  );
};

const UsernameSheet = ({
  initialValue,
  onSave,
  isMutating,
}: {
  initialValue: string;
  onSave: (value: string) => Promise<void>;
  isMutating: boolean;
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [value, setValue] = useState(initialValue ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = (val: string) => {
    try {
      sharedValidators.user.username.parse(val);
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSave = async () => {
    if (isSubmitting || isMutating) return;
    setIsSubmitting(true);
    try {
      await onSave(value.toLowerCase());
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isSubmitting || isMutating;

  return (
    <YStack flex={1}>
      <YStack flex={1} padding="$4" gap="$4">
        <XStack justifyContent="space-between">
          <Text fontSize="$6" fontWeight="bold">
            Edit Username
          </Text>
          <XStack alignItems="center" gap="$2">
            <Text fontSize="$3" color="$gray10">
              {value.length}/30
            </Text>
            <TouchableOpacity onPress={() => setValue("")}>
              <Ionicons name="close-circle" size={20} color={theme.gray8.val} />
            </TouchableOpacity>
          </XStack>
        </XStack>

        <BottomSheetTextInput
          ref={inputRef}
          placeholder="Your username"
          value={value}
          onChangeText={(text) => setValue(text.toLowerCase())}
          maxLength={30}
          autoCapitalize="none"
          autoCorrect={false}
          style={{
            fontWeight: "bold",
            color: theme.color.val,
            backgroundColor: theme.gray5.val,
            padding: getToken("$4", "space") as DimensionValue,
            borderRadius: getToken("$6", "radius") as string,
          }}
        />
      </YStack>

      <XStack padding="$4" paddingBottom={insets.bottom}>
        <Button
          flex={1}
          variant="primary"
          disabled={value === initialValue || isLoading || !isValid(value)}
          onPress={handleSave}
        >
          {isLoading ? <Spinner size="small" color="$color" /> : "Save"}
        </Button>
      </XStack>
    </YStack>
  );
};

const BioSheet = ({
  initialValue,
  onSave,
  isMutating,
}: {
  initialValue: string;
  onSave: (value: string) => Promise<void>;
  isMutating: boolean;
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [value, setValue] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = (val: string) => {
    try {
      sharedValidators.user.bio.parse(val);
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSave = async () => {
    if (isSubmitting || isMutating) return;
    setIsSubmitting(true);
    try {
      await onSave(value);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isSubmitting || isMutating;

  return (
    <YStack flex={1}>
      <YStack flex={1} padding="$4" gap="$4">
        <XStack justifyContent="space-between">
          <Text fontSize="$6" fontWeight="bold">
            Edit Bio
          </Text>
          <XStack alignItems="center" gap="$2">
            <Text fontSize="$3" color="$gray10">
              {value.length}/100
            </Text>
            <TouchableOpacity onPress={() => setValue("")}>
              <Ionicons name="close-circle" size={20} color={theme.gray8.val} />
            </TouchableOpacity>
          </XStack>
        </XStack>

        <BottomSheetTextInput
          ref={inputRef}
          placeholder="Your bio"
          value={value}
          onChangeText={setValue}
          multiline
          maxLength={100}
          style={{
            fontWeight: "bold",
            color: theme.color.val,
            backgroundColor: theme.gray5.val,
            padding: getToken("$4", "space") as DimensionValue,
            borderRadius: getToken("$6", "radius") as string,
            height: 100,
          }}
        />
      </YStack>

      <XStack padding="$4" paddingBottom={insets.bottom}>
        <Button
          flex={1}
          variant="primary"
          disabled={value === initialValue || isLoading || !isValid(value)}
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
  const { privacySetting, onPrivacyChange } = usePrivacySettings();

  const utils = api.useUtils();
  const { data: defaultValues } = api.profile.getFullProfileSelf.useQuery();

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

  const openNameSheet = () => {
    show({
      title: "Edit Name",
      children: (
        <NameSheet
          initialValue={defaultValues?.name ?? ""}
          isMutating={updateProfile.isPending}
          onSave={async (newName) => {
            await updateProfile.mutateAsync({
              name: newName,
            });
            hide();
          }}
        />
      ),
    });
  };

  const openUsernameSheet = () => {
    show({
      title: "Edit Username",
      children: (
        <UsernameSheet
          initialValue={defaultValues?.username ?? ""}
          isMutating={updateProfile.isPending}
          onSave={async (newUsername) => {
            await updateProfile.mutateAsync({
              username: newUsername,
            });
            hide();
          }}
        />
      ),
    });
  };

  const openBioSheet = () => {
    show({
      title: "Edit Bio",
      children: (
        <BioSheet
          initialValue={defaultValues?.bio ?? ""}
          isMutating={updateProfile.isPending}
          onSave={async (newBio) => {
            await updateProfile.mutateAsync({
              bio: newBio,
            });
            hide();
          }}
        />
      ),
    });
  };

  return (
    <ScreenView scrollable safeAreaEdges={["bottom"]}>
      <YStack gap="$5">
        {/* Profile Picture Section */}
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
                <Ionicons name="camera" size={24} color={theme.blue9.val} />
              </View>
            </View>
            <Text color="$blue10">Change photo</Text>
          </YStack>
        </TouchableOpacity>

        {/* Profile Information Card */}
        <CardContainer padding="$4">
          <YStack gap="$4">
            <HeaderTitle>Profile Information</HeaderTitle>

            {/* Name Field */}
            <XStack
              justifyContent="space-between"
              alignItems="center"
              onPress={openNameSheet}
            >
              <XStack flex={1} alignItems="center" gap="$3">
                <Ionicons
                  name="person-outline"
                  size={24}
                  color={theme.gray10.val}
                />
                <YStack flex={1}>
                  <Text fontSize="$5" fontWeight="500">
                    {defaultValues?.name || "Add name"}
                  </Text>
                  <Text color="$gray10">Name</Text>
                </YStack>
              </XStack>
              <ChevronRight size={24} color="$gray10" />
            </XStack>
            <Separator />

            {/* Username Field */}
            <XStack
              justifyContent="space-between"
              alignItems="center"
              onPress={openUsernameSheet}
            >
              <XStack flex={1} alignItems="center" gap="$3">
                <Ionicons name="at" size={24} color={theme.gray10.val} />
                <YStack flex={1}>
                  <Text fontSize="$5" fontWeight="500">
                    {defaultValues?.username || "Add username"}
                  </Text>
                  <Text color="$gray10">Username</Text>
                </YStack>
              </XStack>
              <ChevronRight size={24} color="$gray10" />
            </XStack>
            <Separator />

            {/* Bio Field */}
            <XStack
              justifyContent="space-between"
              alignItems="center"
              onPress={openBioSheet}
            >
              <XStack flex={1} alignItems="center" gap="$3">
                <Ionicons
                  name="information-circle-outline"
                  size={24}
                  color={theme.gray10.val}
                />
                <YStack flex={1}>
                  <Text fontSize="$5" fontWeight="500">
                    {defaultValues?.bio ? "Edit Bio" : "Add bio"}
                  </Text>
                  {defaultValues?.bio && (
                    <Text color="$gray10" numberOfLines={1}>
                      {defaultValues.bio}
                    </Text>
                  )}
                </YStack>
              </XStack>
              <ChevronRight size={24} color="$gray10" />
            </XStack>
          </YStack>
        </CardContainer>

        {/* Privacy Settings Card */}
        <CardContainer padding="$4">
          <YStack gap="$4">
            <HeaderTitle>Privacy Settings</HeaderTitle>
            <XStack justifyContent="space-between" alignItems="center">
              <XStack flex={1} alignItems="center" gap="$3">
                <BookLock size={24} color={theme.gray10.val} />
                <YStack flex={1}>
                  <Text fontSize="$5" fontWeight="500">
                    Private Account
                  </Text>
                  <Text color="$gray10">
                    Only followers can see your content
                  </Text>
                </YStack>
              </XStack>
              <Switch
                size="$3"
                checked={privacySetting === "private"}
                onCheckedChange={onPrivacyChange}
              >
                <Switch.Thumb animation="quick" />
              </Switch>
            </XStack>
          </YStack>
        </CardContainer>
      </YStack>
    </ScreenView>
  );
};

export default EditProfile;
