import { Tabs } from 'expo-router/tabs';
export default function Footer() {
  return (
    <Tabs 
    screenOptions={{headerShown: false}}>
      <Tabs.Screen
        name="profile"
        options={{
        }}
      />
    </Tabs>
  );
}