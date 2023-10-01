import React, { useEffect, useState } from "react";
import { openInbox } from "react-native-email-link";
import { useRouter } from "expo-router";
import auth from "@react-native-firebase/auth";
import { Button, H1, H5, Text, View, YStack } from "tamagui";

import { api } from "~/utils/api";

const RESEND_EMAIL_VERIFICATION_COOLDOWN = 60000; // 60 seconds

const VerifyEmail = () => {
  const { data } = api.auth.getUser.useQuery();

  const router = useRouter();

  const [cooldownEnd, setCooldownEnd] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number>(0);

  const sendVerificationEmail = async () => {
    const currentUser = auth().currentUser;

    if (!currentUser) {
      return;
    }

    try {
      await currentUser.sendEmailVerification();
      setCooldownEnd(Date.now() + RESEND_EMAIL_VERIFICATION_COOLDOWN);

      console.log("Email sent");
    } catch (err) {
      console.log("Error sending email verification", err);
    }
  };

  useEffect(() => {
    const updateCountdown = () => {
      if (!cooldownEnd) {
        return setCountdown(0);
      }

      const now = Date.now();
      const remainingSeconds = Math.max(
        Math.floor((cooldownEnd - now) / 1000),
        0,
      );

      setCountdown(remainingSeconds);

      if (remainingSeconds === 0) {
        setCooldownEnd(null);
      }
    };

    updateCountdown();
    const countdownInterval = setInterval(updateCountdown, 1000);
    return () => clearInterval(countdownInterval);
  }, [cooldownEnd]);

  useEffect(() => {
    void sendVerificationEmail();

    const checkEmailVerification = async () => {
      const currentUser = auth().currentUser;

      if (!currentUser) {
        return;
      }

      try {
        await currentUser.reload();

        if (currentUser.emailVerified) {
          console.log("Email Verified!");
          router.replace("/auth/change-this");
        }
      } catch (err) {
        console.log("Error checking email verification", err);
      }
    };

    const interval = setInterval(() => {
      void checkEmailVerification();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View
      flex={1}
      backgroundColor="$background"
      padding="$6"
      justifyContent="space-between"
    >
      <YStack space>
        <H1 fontFamily="$silkscreen" fontWeight="700" letterSpacing="$4">
          Lets get you verified!
        </H1>

        <Text padding="$2" textAlign="center" fontSize={12}>
          To confirm your email address, follow the instructions sent to{" "}
          <Text fontWeight="500" textDecorationLine="underline">
            {data?.email}
          </Text>
          .
        </Text>

        <Button
          animation="100ms"
          pressStyle={{
            scale: 0.95,
            backgroundColor: "white",
          }}
          height="$5"
          borderRadius="$8"
          backgroundColor="white"
          color="black"
          fontWeight="500"
          fontSize={16}
          onPress={() => openInbox()}
        >
          Launch Email App
        </Button>

        <Button
          animation="100ms"
          pressStyle={{
            scale: 0.95,
            backgroundColor: "white",
          }}
          height="$5"
          borderRadius="$8"
          color="black"
          fontWeight="500"
          fontSize={16}
          disabled={countdown > 0}
          backgroundColor={countdown > 0 ? "$gray7" : "white"}
          onPress={sendVerificationEmail}
        >
          {countdown > 0
            ? `Resend in ${countdown}s`
            : "Resend Verification Email"}
        </Button>
      </YStack>
    </View>
  );
};

export default VerifyEmail;
