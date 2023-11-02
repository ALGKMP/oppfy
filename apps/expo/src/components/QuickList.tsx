import React, { useState } from "react";
import {
  Button,
  Dimensions,
  FlatList,
  Modal,
  SectionList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Separator, Text, useTheme, View, XStack } from "tamagui";

import { groupedCountries } from "~/data/groupedCountries";

const DATA = Array.from({ length: 1000 }).map((_, i) => ({
  id: i.toString(),
  text: `TESTING ${i}`,
}));

const stickyHeaderIndices = groupedCountries
  .map((item, index) => {
    if (typeof item === "string") {
      return index;
    } else {
      return null;
    }
  })
  .filter((item) => item !== null) as number[];

const CountriesFlastList = () => {
  return (
    <FlashList
      estimatedListSize={{
        height: Dimensions.get("window").height,
        width: Dimensions.get("window").width,
      }}
      estimatedItemSize={48}
      data={groupedCountries}
      renderItem={({ item }) => {
        if (typeof item === "string") {
          // Rendering header
          return (
            <View paddingHorizontal="$6" marginVertical={8}>
              <Text fontSize={10} fontWeight="600">
                {item}
              </Text>
            </View>
          );
        } else {
          // Render item
          return (
            <View paddingHorizontal="$6">
              <TouchableOpacity
                onPress={() => console.log("TEST")}
                style={{
                  padding: 12,
                  backgroundColor: "grey",
                }}
              >
                <XStack space={8} alignItems="center">
                  <Text fontSize={18}>{item.flag}</Text>
                  <Text fontSize={16} fontWeight="600">
                    {item.name}
                  </Text>
                  <Text fontSize={16} fontWeight="600" color="$gray11">
                    ({item.dialingCode})
                  </Text>
                </XStack>
              </TouchableOpacity>
            </View>
          );
        }
      }}
      stickyHeaderIndices={stickyHeaderIndices}
      getItemType={(item) => {
        // To achieve better performance, specify the type based on the item
        return typeof item === "string" ? "sectionHeader" : "row";
      }}
    />
  );
};

const QuickModal = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Button title="Show Modal" onPress={() => setIsModalVisible(true)} />

      <Modal
        animationType="slide"
        transparent={false}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Button title="Hide Modal" onPress={() => setIsModalVisible(false)} />

          {/* <SectionList
            sections={groupedCountries}
            keyExtractor={(item) => item.dialingCode + item.name}
            initialNumToRender={100} // Increased initial render items
            maxToRenderPerBatch={50} // Increased batch render items
            windowSize={21}
            renderItem={({ item, index, section }) => (
              <View paddingHorizontal="$6">
                <TouchableOpacity
                  onPress={() => console.log("TEST")}
                  style={{
                    padding: 12,
                    backgroundColor: theme.gray1.val,
                    borderTopLeftRadius: index === 0 ? 10 : 0,
                    borderTopRightRadius: index === 0 ? 10 : 0,
                    borderBottomLeftRadius:
                      index === section.data.length - 1 ? 10 : 0,
                    borderBottomRightRadius:
                      index === section.data.length - 1 ? 10 : 0,
                  }}
                >
                  <XStack space={8} alignItems="center">
                    <Text fontSize={18}>{item.flag}</Text>
                    <Text fontSize={16} fontWeight="600">
                      {item.name}
                    </Text>
                    <Text fontSize={16} fontWeight="600" color="$gray11">
                      ({item.dialingCode})
                    </Text>
                  </XStack>
                </TouchableOpacity>
                {index !== section.data.length - 1 && <Separator />}
              </View>
            )}
            renderSectionHeader={({ section: { title } }) => (
              <View paddingHorizontal="$6" marginVertical={8}>
                <Text fontSize={10} fontWeight="600">
                  {title}
                </Text>
              </View>
            )}
          /> */}

          {/* <SectionList
            data={DATA}
            renderItem={({ item }) => <Item text={item.text} />}
            keyExtractor={(item) => item.id}
            initialNumToRender={50}
            maxToRenderPerBatch={100}
            windowSize={100}
          /> */}
          <CountriesFlastList />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
  },
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
});

export default QuickModal;
