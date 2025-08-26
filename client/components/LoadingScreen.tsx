import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const LoadingScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Image 
        source={require('../assets/PPlogo.png')} 
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.text}>
        Practice Pro
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  text: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
  },
});

export default LoadingScreen;
