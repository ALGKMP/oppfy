import React from 'react';
import { styled } from 'tamagui';
import { View } from 'react-native';

const MediaOfFriendsLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <Container>{children}</Container>;
};

export default MediaOfFriendsLayout;

const Container = styled(View, {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'center',
  padding: 10,
});
