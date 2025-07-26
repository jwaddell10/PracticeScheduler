import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';

export default function Modal() {
  const navigation = useNavigation();

  return (
    <Animated.View
      entering={FadeIn}
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#00000040',
      }}
    >
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => navigation.goBack()}
      />
      <Animated.View
        entering={SlideInDown}
        style={{
          width: '90%',
          height: '80%',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'white',
        }}
      >
        <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Modal Screen</Text>
        <Pressable onPress={() => navigation.goBack()}>
          <Text>← Go back</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}
