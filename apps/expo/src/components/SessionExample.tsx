import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { authClient } from "~/utils/better-auth";

export function SessionExample() {
  const { data: session, isPending, error } = authClient.useSession();

  if (isPending) {
    return (
      <View style={styles.container}>
        <Text>Loading session...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text>Error loading session: {error.message}</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.container}>
        <Text>Not signed in</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {session.user.name || "User"}!</Text>
      <Text>Email: {session.user.email || "No email"}</Text>
      <Text>Phone: {session.user.phoneNumber || "No phone"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
});
