import { Tabs } from 'expo-router/tabs';
import { Home } from '@tamagui/lucide-icons';
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
        name="profile"
        options={{
          tabBarIcon: () => <Home/>
  
        }}
      />

      <Tabs.Screen
        name="(top-tabs)/following"
      />

      <Tabs.Screen
        name=""
        options={{
          tabBarIcon: () => <Home/>
  
        }}
      />

      <Tabs.Screen
        name="fg"
        options={{
          tabBarIcon: () => <Home/>
  
        }}
      />

      <Tabs.Screen
        name="gfds"
        options={{
          tabBarIcon: () => <Home/>
  
        }}
      />

    </Tabs>
  );
}