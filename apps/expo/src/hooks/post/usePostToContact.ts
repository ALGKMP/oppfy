import { useCallback } from "react";

import { api } from "~/utils/api";
import useUploadMedia from "../media/useUploadMedia";

export const usePostToContact = () => {
  // MARKER: pendingUser
  const { mutateAsync: createPostForContact } =
    api.pendingUser.createPostForContact.useMutation();

  const postToContact = useCallback(
    async ({
      phoneNumber,
      contactName,
      mediaUri,
      caption,
      width,
      height,
      mediaType,
    }: {
      phoneNumber: string;
      contactName?: string;
      mediaUri: string;
      caption: string;
      width: number;
      height: number;
      mediaType: "image" | "video";
    }) => {
      try {
        // First upload the media
        const mediaKey = await uploadMedia(mediaUri);

        // Then create the post for the contact
        const post = await createPostForContact({
          phoneNumber,
          contactName,
          mediaKey,
          caption,
          width,
          height,
          mediaType,
        });

        return post;
      } catch (error) {
        console.error("Error posting to contact:", error);
        throw error;
      }
    },
    [createPostForContact, uploadMedia],
  );

  return {
    postToContact,
  };
};
