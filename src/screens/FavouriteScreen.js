import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageBackground,
  Share,
  Modal,
  Dimensions,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { removeFavourite } from '../features/favouritesSlice';
import Icon from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

export default function FavouriteScreen({ navigation }) {
  const { items: favourites } = useSelector(state => state.favourites);
  const dispatch = useDispatch();

  const [showModal, setShowModal] = useState(false);
  const [selectedCode, setSelectedCode] = useState(null);

  // Share with deep link
  const handleShare = async country => {
    try {
      const deepLink = `myapp://Country/${country.code}`; // custom deep link
      await Share.share({
        message: `Check out ${country.name} (${country.region})\n${deepLink}`,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  // Flag from API
  const getFlagUrl = alpha2 =>
    `https://flagcdn.com/w160/${alpha2.toLowerCase()}.png`;

  // Delete confirm
  const confirmDelete = code => {
    setSelectedCode(code);
    setShowModal(true);
  };

  const handleDelete = () => {
    if (selectedCode) {
      dispatch(removeFavourite(selectedCode));
      setSelectedCode(null);
    }
    setShowModal(false);
  };

  return (
    <ImageBackground
      source={require('../../assets/background.gif')}
      style={styles.bg}
    >
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Image
            source={require('../../assets/goBack.png')}
            style={styles.backIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.titleText}>Favourites</Text>
      </View>

      {/* Empty List */}
      {!favourites.length ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No favourites yet</Text>
        </View>
      ) : (
        <FlatList
          data={favourites}
          keyExtractor={item => item.code}
          contentContainerStyle={{ padding: 20, paddingTop: 10 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                navigation.navigate('CountryProfile', {
                  countryCode: item.code,
                })
              }
            >
              {/* Info */}
              <View style={styles.info}>
                {item.flag ? (
                  <Image
                    source={{ uri: getFlagUrl(item.flag) }}
                    style={styles.flag}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.flag, { backgroundColor: '#ccc' }]} />
                )}
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardRegion}>{item.region}</Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() => handleShare(item)}
                  style={styles.iconBtn}
                >
                  <Icon name="share-social-outline" size={22} color="#003566" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => confirmDelete(item.code)}
                  style={styles.iconBtn}
                >
                  <Icon name="trash-outline" size={22} color="red" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Confirm Delete Modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalText}>
              Are you sure you want to remove?
            </Text>

            <Icon
              name="trash-outline"
              size={70}
              color="#0077b6"
              style={{ marginVertical: 12 }}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.okBtn]}
                onPress={handleDelete}
              >
                <Text style={styles.okText}>OK</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelText}>CANCEL</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, resizeMode: 'cover' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 25,
    marginBottom: 10,
  },
  backBtn: { marginRight: 10 },
  backIcon: { width: 28, height: 28 },
  titleText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginRight: 38,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, color: '#fff', fontWeight: '600' },
  card: {
    width: width - 40,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,1)',
    marginBottom: 12,
  },
  info: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  flag: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#ddd',
    borderWidth: 1,
    borderColor: '#fff',
  },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#444444ff' },
  cardRegion: { fontSize: 14, color: '#1d1d1dff' },
  actions: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { marginLeft: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: width - 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    overflow: 'hidden',
  },
  modalText: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
  modalActions: {
    flexDirection: 'row',
    marginTop: 15,
    width: '100%',
    borderTopWidth: 1,
    borderColor: '#e0e0e0',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  okBtn: { backgroundColor: '#0077b6' },
  cancelBtn: { backgroundColor: '#f0f0f0' },
  okText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelText: { color: '#000', fontSize: 16, fontWeight: '600' },
});
