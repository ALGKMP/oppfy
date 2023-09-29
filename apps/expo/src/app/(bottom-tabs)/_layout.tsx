import { Tabs } from 'expo-router/tabs';
import { Camera, Home, Inbox, Search, User2 } from '@tamagui/lucide-icons';
export default function Footer() {
  return (
    <Tabs 
    screenOptions={{headerShown: false, tabBarStyle: {
      backgroundColor: 'black',
      borderTopColor: 'grey',
      height: 60,
      paddingTop: 10,
      paddingBottom: 10,
      borderTopWidth: 1,
    },
    tabBarShowLabel: false
    }}>

      <Tabs.Screen
        name="(top-tabs)"
        options={{
          tabBarIcon: () => <Home/>
        }}
      />
      
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: () => <Search/>
        }}
      />

      <Tabs.Screen
        name="camera"
        options={{
          tabBarIcon: () => <Camera/>
        }}
      />

      <Tabs.Screen
        name="inbox"
        options={{
          tabBarIcon: () => <Inbox/>
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: () => <User2/>
        }}
      />

    </Tabs>
  );
}