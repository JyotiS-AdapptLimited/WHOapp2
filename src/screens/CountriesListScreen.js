import React, { useEffect, useState, useCallback, useMemo, memo } from 'react';
import {
  View,
  SectionList,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import {
  fetchCountriesRequest,
  setSearch,
  filterBySegment,
} from '../features/countriesSlice';
import Icon from 'react-native-vector-icons/Ionicons';
import AlphabetSegmentBar from '../component/AlphabetSegmentBar';

const { width } = Dimensions.get('window');
const SEGMENTS = ['A...C', 'D...J', 'K...Q', 'R...Z'];

const SectionHeader = memo(({ title }) => (
  <View style={styles.sectionHeaderContainer}>
    <Text style={styles.sectionHeader}>{title}</Text>
  </View>
));

const RenderCountryItem = memo(({ item, index, navigation }) => {
  const flagSource = item.flag
    ? {
        uri: `https://flagcdn.com/w40/${item.flag.toLowerCase()}.png`,
        cache: 'force-cache',
      }
    : null;

  return (
    <TouchableOpacity
      style={[styles.item, index % 2 === 0 ? styles.itemEven : styles.itemOdd]}
      onPress={() =>
        navigation.navigate('CountryProfile', { countryCode: item.iso })
      }
    >
      <View style={styles.itemLeft}>
        {flagSource ? (
          <Image source={flagSource} style={styles.flag} resizeMode="cover" />
        ) : (
          <View style={[styles.flag, { backgroundColor: '#ccc' }]} />
        )}
        <Text style={styles.name}>{item.name}</Text>
      </View>
      <Icon name="chevron-forward" size={20} color="#353434ff" />
    </TouchableOpacity>
  );
});

export default function CountriesListScreen({ navigation }) {
  const dispatch = useDispatch();

  const { groupedCountries, loading, search, error } = useSelector(
    state => ({
      groupedCountries: state.countries.groupedCountries,
      loading: state.countries.loading,
      search: state.countries.search,
      error: state.countries.error,
    }),
    shallowEqual,
  );

  const [selectedSegment, setSelectedSegment] = useState('');

  useEffect(() => {
    dispatch(fetchCountriesRequest());
  }, [dispatch]);

  const onSearch = useCallback(
    text => {
      if (text.trim()) setSelectedSegment(null);
      dispatch(setSearch(text));
    },
    [dispatch],
  );

  const onSegmentPress = useCallback(
    label => {
      setSelectedSegment(label);
      dispatch(filterBySegment(label));
    },
    [dispatch],
  );

  const sections = useMemo(() => groupedCountries || [], [groupedCountries]);
  const keyExtractor = useCallback(item => item.iso, []);

  const renderItem = useCallback(
    ({ item, index }) => (
      <RenderCountryItem item={item} index={index} navigation={navigation} />
    ),
    [navigation],
  );

  const renderSectionHeader = useCallback(
    ({ section: { title } }) => <SectionHeader title={title} />,
    [],
  );

  const getItemLayout = useCallback(
    (data, index) => ({
      length: 75,
      offset: 75 * index,
      index,
    }),
    [],
  );

  if (loading) return <ActivityIndicator style={styles.center} size="large" />;
  if (error) return <Text style={styles.center}>{error}</Text>;

  return (
    <ImageBackground
      source={require('../../assets/home_bg.png')}
      style={styles.background}
      resizeMode="cover"
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Image
            source={require('../../assets/goBack.png')}
            style={styles.searchIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Countries</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <Image
          source={require('../../assets/search.png')}
          style={styles.searchIcon}
          resizeMode="contain"
        />
        <TextInput
          value={search}
          onChangeText={onSearch}
          placeholder="Search"
          style={styles.searchInput}
          placeholderTextColor="#fff"
        />
      </View>

      {/* Country List */}
      <View style={styles.listContainer}>
        <SectionList
          sections={sections}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          getItemLayout={getItemLayout}
          stickySectionHeadersEnabled
          initialNumToRender={20}
          maxToRenderPerBatch={20}
          windowSize={21}
          removeClippedSubviews
          contentContainerStyle={{ paddingBottom: 160 }}
        />
      </View>

      {/* Alphabet Segment Bar */}
      <AlphabetSegmentBar
        segments={SEGMENTS}
        selectedSegment={selectedSegment}
        onSegmentPress={onSegmentPress}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#0077b6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  backButton: { marginRight: 10 },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginRight: 28,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 30,
    height: 48,
  },
  searchIcon: { width: 18, height: 18, marginLeft: 9, tintColor: '#fff' },
  searchInput: { flex: 1, fontSize: 16, color: '#fff', paddingHorizontal: 12 },
  listContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  sectionHeaderContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#cac8c88a',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderTopWidth: 1,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c2d2dff',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 75,
    paddingHorizontal: 16,
  },
  itemEven: { backgroundColor: '#eaf5fca5' },
  itemOdd: { backgroundColor: '#fff' },
  itemLeft: { flexDirection: 'row', alignItems: 'center' },
  flag: {
    width: 26,
    height: 26,
    borderRadius: 13,
    marginRight: 12,
    borderColor: '#fff',
    borderWidth: 1,
  },
  name: { fontSize: 16, color: '#333' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
