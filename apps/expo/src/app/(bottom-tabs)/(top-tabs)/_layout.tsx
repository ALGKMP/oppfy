import { Tabs } from 'expo-router/tabs';
import { Home } from '@tamagui/lucide-icons';
export default function Footer() {
  return (
    <Tabs>
      <Tabs.Screen
        name="following"
      />

      <Tabs.Screen
        name="recommended"
      />
    </Tabs>
  );
}