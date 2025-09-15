import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Image,
  ImageBackground,
  FlatList,
  Animated,
  Easing,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchIndicatorsRequest } from '../features/countryIndicatorsSlice';

const darkenColor = (hex, amount = 15) => {
  if (!hex || !hex.startsWith('#')) return '#ccc';

  let color = hex.replace('#', '');
  if (color.length === 3)
    color = color
      .split('')
      .map(c => c + c)
      .join('');

  const num = parseInt(color, 16);
  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;

  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  l = Math.max(0, l - amount / 100);

  let rOut, gOut, bOut;
  if (s === 0) rOut = gOut = bOut = l;
  else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    rOut = hue2rgb(p, q, h + 1 / 3);
    gOut = hue2rgb(p, q, h);
    bOut = hue2rgb(p, q, h - 1 / 3);
  }

  return `rgb(${Math.round(rOut * 255)}, ${Math.round(
    gOut * 255,
  )}, ${Math.round(bOut * 255)})`;
};

const DomainsScreen = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const { selectedCountry, loading, error } = useSelector(
    state => state.indicators,
  );
  const { countryCode } = route.params;

  const [expanded, setExpanded] = useState({});
  const [allExpanded, setAllExpanded] = useState(false);

  const progressAnimValues = useRef({}).current; // Store animated values for each domain

  const accordionIcons = [
    require('../../assets/accordion_1.png'),
    require('../../assets/accordion_2.png'),
    require('../../assets/accordion_3.png'),
    require('../../assets/accordion_4.png'),
    require('../../assets/accordion_5.png'),
  ];

  const statusMap = {
    YES: { type: 'icon', icon: require('../../assets/yes.png') },
    NO: { type: 'icon', icon: require('../../assets/no.png') },
    DK: { type: 'color', color: '#565655a4', label: "Don't know" },
    NAT: { type: 'color', color: '#04cf33a4', label: 'National coverage' },
    SUBNAT: {
      type: 'color',
      color: '#fff707d8',
      label: 'Subnational coverage',
    },
    NOT: {
      type: 'color',
      color: '#ff8800f6',
      label: 'Sub-nationallevels with limited coverage',
    },
    SUBLIM: {
      type: 'color',
      color: '#d30000ec',
      label: "Not implemented/Don't know/did not provide",
    },
    SUBEXT: {
      type: 'color',
      color: '#5b6bf8ff',
      label: 'Sub-national with extensive coverage',
    },
  };

  useEffect(() => {
    if (countryCode) dispatch(fetchIndicatorsRequest(countryCode));
  }, [countryCode]);

  useEffect(() => {
    // Initialize Animated values and animate once on mount
    if (selectedCountry?.domains) {
      selectedCountry.domains.forEach(domain => {
        const progress = domain.progress / 100;
        if (!progressAnimValues[domain.unique_key]) {
          progressAnimValues[domain.unique_key] = new Animated.Value(0);
          Animated.timing(progressAnimValues[domain.unique_key], {
            toValue: progress * 100,
            duration: 800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }).start();
        }
      });
    }
  }, [selectedCountry]);

  const toggleExpand = key => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAllExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newState = !allExpanded;
    setAllExpanded(newState);

    const updated = {};
    selectedCountry.domains
      .filter(domain => domain.key !== 'Burden')
      .forEach(d => {
        updated[d.unique_key] = newState;
      });
    updated['footnotes'] = newState;
    setExpanded(updated);
  };

  const renderStatus = value => {
    const status = statusMap[value];
    if (!status) return null;
    return status.type === 'icon' ? (
      <Image source={status.icon} style={styles.statusIcon} />
    ) : (
      <View style={[styles.statusCircle, { backgroundColor: status.color }]} />
    );
  };

  if (loading)
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  if (error)
    return (
      <View style={styles.center}>
        <Text style={{ color: 'red' }}>Error: {error}</Text>
      </View>
    );
  if (!selectedCountry)
    return (
      <View style={styles.center}>
        <Text>No data available</Text>
      </View>
    );

  const flatListData = [
    ...selectedCountry.domains.filter(d => d.key !== 'Burden'),
    { key: 'footnotes' },
  ];

  const DomainCard = ({ domain, index }) => {
    const bgColor = domain.color || '#fff';
    const progressColor = domain.progressBg || '#ccc';
    const icon = accordionIcons[index % accordionIcons.length];
    const animatedWidth = progressAnimValues[domain.unique_key];

    const animatedStyle = {
      width:
        animatedWidth?.interpolate({
          inputRange: [0, 100],
          outputRange: ['0%', '100%'],
        }) || '0%',
    };

    return (
      <View style={[styles.card, { backgroundColor: bgColor }]}>
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => toggleExpand(domain.unique_key)}
        >
          <View style={styles.cardHeaderLeft}>
            <Image source={icon} style={styles.cardIcon} />
            <Text style={styles.cardTitle}>{domain.key}</Text>
          </View>
          <Image
            source={
              expanded[domain.unique_key]
                ? require('../../assets/arrow_up.png')
                : require('../../assets/arrow_down.png')
            }
            style={styles.arrowIcon}
          />
        </TouchableOpacity>

        <View
          style={[
            styles.progressBg,
            { backgroundColor: darkenColor(bgColor, 5) },
          ]}
        >
          <Animated.View
            style={[
              styles.progressFill,
              { backgroundColor: progressColor },
              animatedStyle,
            ]}
          />
        </View>

        {expanded[domain.unique_key] && (
          <View style={styles.pillContainer}>
            {domain.indicators.map(ind => (
              <View
                key={ind.unique_key}
                style={[styles.pill, { backgroundColor: ind.color || '#fff' }]}
              >
                <View style={styles.pillRow}>
                  <Image
                    source={require('../../assets/info.png')}
                    style={styles.infoIcon}
                  />
                  <Text style={styles.pillText}>{ind.label || ind.key}</Text>
                  {ind.region !== false && !statusMap[ind.value] && (
                    <Text style={styles.inlineValue}>{ind.value}</Text>
                  )}
                  {statusMap[ind.value] && renderStatus(ind.value)}
                </View>
                {ind.region === false && !statusMap[ind.value] && (
                  <Text style={styles.extraValue}>{ind.value}</Text>
                )}
                {ind.description && (
                  <Text style={styles.pillDesc}>{ind.description}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderItem = ({ item, index }) => {
    if (item.key === 'footnotes') {
      return (
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.cardHeader}
            onPress={() => toggleExpand('footnotes')}
          >
            <View style={styles.cardHeaderLeft}>
              <Image
                source={require('../../assets/accordion_6.png')}
                style={styles.cardIcon}
              />
              <Text style={styles.cardTitle}>Footnotes</Text>
            </View>
            <Image
              source={
                expanded['footnotes']
                  ? require('../../assets/arrow_up.png')
                  : require('../../assets/arrow_down.png')
              }
              style={styles.arrowIcon}
            />
          </TouchableOpacity>
          {expanded['footnotes'] && (
            <View style={styles.footnotesCard}>
              {[
                ...Object.entries(statusMap).map(([key, item]) => ({
                  label: item.label || key,
                  ...item,
                })),
                { label: 'Did not provide', type: 'color', color: '#ccc' },
              ].map((item, idx) => (
                <View key={idx} style={styles.footnoteRow}>
                  {item.type === 'icon' ? (
                    <Image source={item.icon} style={styles.footnoteIcon} />
                  ) : (
                    <View
                      style={[
                        styles.footnoteCircle,
                        { backgroundColor: item.color },
                      ]}
                    />
                  )}
                  <Text style={styles.footnoteText}>{item.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      );
    }
    return <DomainCard domain={item} index={index} />;
  };

  return (
    <ImageBackground
      source={require('../../assets/home_bg.png')}
      style={styles.bg}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Image
            source={require('../../assets/goBack.png')}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{selectedCountry.name}</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.contentWrapper}>
        <View style={styles.sectionHeader}>
          <Text style={styles.subHeader}>Domains</Text>
          <TouchableOpacity onPress={toggleAllExpand}>
            <Image
              source={
                allExpanded
                  ? require('../../assets/shrink.png')
                  : require('../../assets/expand.png')
              }
              style={styles.sectionIcon}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.sectionDivider} />
        <FlatList
          data={flatListData}
          renderItem={renderItem}
          keyExtractor={(item, index) =>
            item.unique_key || item.key || index.toString()
          }
          contentContainerStyle={{ padding: 10, paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  bg: { flex: 1, resizeMode: 'cover' },
  header: {
    height: '11%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  backBtn: { paddingTop: 35 },
  backIcon: { width: 23, height: 23, resizeMode: 'contain' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    paddingTop: 35,
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 10,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginLeft: 20,
  },
  subHeader: { fontSize: 18, fontWeight: '600' },
  sectionIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
    marginRight: 16,
  },
  card: {
    borderRadius: 16,
    padding: 10,
    marginBottom: 6,
    backgroundColor: '#e4e2e24b',
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  cardIcon: { width: 34, height: 34, marginRight: 10, resizeMode: 'contain' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#000' },
  arrowIcon: { width: 15, height: 15, resizeMode: 'contain', marginLeft: 8 },
  progressBg: {
    height: 30,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: { height: '100%', borderRadius: 12 },
  pillContainer: { flexDirection: 'column', marginTop: 8 },
  pill: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  pillRow: { flexDirection: 'row', alignItems: 'center' },
  infoIcon: { width: 22, height: 22, marginRight: 6, resizeMode: 'contain' },
  pillText: { flex: 1, fontSize: 14, color: '#333' },
  inlineValue: { fontSize: 14, color: '#333', marginLeft: 4 },
  statusIcon: { width: 22, height: 22, marginLeft: 8, resizeMode: 'contain' },
  statusCircle: { width: 20, height: 20, borderRadius: 10, marginLeft: 10 },
  extraValue: {
    marginTop: 6,
    marginLeft: 28,
    fontSize: 14,
    color: '#33333399',
  },
  pillDesc: { marginTop: 4, fontSize: 13, color: '#777', paddingLeft: 22 },
  footnotesCard: { marginTop: 10, padding: 6 },
  footnoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  footnoteIcon: {
    width: 25,
    height: 25,
    marginRight: 12,
    resizeMode: 'contain',
  },
  footnoteCircle: {
    width: 27,
    height: 27,
    borderRadius: 15,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  footnoteText: { fontSize: 14, color: '#333', flexShrink: 1 },
  sectionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginHorizontal: 10,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default DomainsScreen;
