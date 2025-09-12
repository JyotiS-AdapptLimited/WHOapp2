import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native'; 
export default function BottomNav() {
  const navigation = useNavigation();
  return (
    <View style={styles.tabBar}>
      <TouchableOpacity>
        <Icon name="menu" size={29} color="#001f3bff" />
      </TouchableOpacity>
      <TouchableOpacity>
        <Icon name="grid" size={29} color="#001f3bff" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Favourite")}> 
        <Icon name="star" size={29} color="#001f3bff" />
      </TouchableOpacity>
      <TouchableOpacity>
        <Icon name="ellipsis-horizontal" size={29} color="#001f3bff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0, 
    left: 0,
    right: 0,
    marginHorizontal: 16,
    marginBottom: 16, 
    height: 60,
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 86, 179, 0.2)',
    backgroundColor: 'rgba(0, 87, 179, 0.4)',
    paddingHorizontal: 10,
  },
});
