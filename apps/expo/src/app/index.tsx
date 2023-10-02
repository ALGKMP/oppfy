import React, { useState } from "react";
import { ImageBackground, Pressable } from "react-native";
import { Redirect, useRouter } from "expo-router";
import Tinder from "@assets/tinder.png";
import { ChevronLeft } from "@tamagui/lucide-icons";
import { Button, Text, View, YStack } from "tamagui";
import { api } from "~/utils/api";

// TODO: figure out how to change this file name
const Index = () => {
  return <Redirect href="auth-welcome" />;
};

export default Index;
