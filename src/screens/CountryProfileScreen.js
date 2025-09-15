import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Image,
  ImageBackground,
  TouchableOpacity,
  Animated as RNAnimated,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchIndicatorsRequest,
  setSelectedCountry,
} from '../features/countryIndicatorsSlice';
import Svg, { G, Path, Line, Text as SvgText, Rect } from 'react-native-svg';
import * as d3Shape from 'd3-shape';
import * as d3Scale from 'd3-scale';
import { toggleFavourite } from '../features/favouritesSlice';
import Icon from 'react-native-vector-icons/Ionicons';

const screenWidth = Dimensions.get('window').width;
const chartHeight = 260;
const AnimatedPath = RNAnimated.createAnimatedComponent(Path);

export default function CountryProfileScreen({ navigation, route }) {
  const { countryCode } = route.params;
  const dispatch = useDispatch();

  const { selectedCountry, loading, error } = useSelector(
    state => state.indicators,
  );
  const favourites = useSelector(state => state.favourites?.items || []);

  const [activeTab, setActiveTab] = useState('age');

  useEffect(() => {
    if (countryCode) {
      dispatch(fetchIndicatorsRequest(countryCode));
      dispatch(setSelectedCountry(countryCode));
    }
  }, [countryCode, dispatch]);

  const isFavourite = useMemo(
    () => favourites.some(item => item.code === countryCode),
    [favourites, countryCode],
  );

  const handleToggleFavourite = useCallback(() => {
    if (!selectedCountry) return;
    dispatch(
      toggleFavourite({
        code: countryCode,
        name: selectedCountry.name,
        region: selectedCountry.region,
        flag: selectedCountry.flag || countryCode.slice(0, 2),
      }),
    );
  }, [dispatch, countryCode, selectedCountry]);

  const pieData = useMemo(() => {
    if (!Array.isArray(selectedCountry?.pieChart?.values)) return [];
    return selectedCountry.pieChart.values.map((val, idx) => ({
      name: getAgeLabel(idx),
      population: Number(val) || 0,
      color: getAgeColor(idx),
    }));
  }, [selectedCountry]);

  const lineData = useMemo(() => {
    if (!selectedCountry?.trendsChart) return { labels: [], datasets: [] };
    const chart = selectedCountry.trendsChart;
    const datasets = [];
    if (Array.isArray(chart.male) && chart.male.length)
      datasets.push({
        data: chart.male.map(Number),
        color: '#2E7D32',
        label: 'Male',
      });
    if (Array.isArray(chart.female) && chart.female.length)
      datasets.push({
        data: chart.female.map(Number),
        color: '#0277BD',
        label: 'Female',
      });
    if (Array.isArray(chart.total) && chart.total.length)
      datasets.push({
        data: chart.total.map(Number),
        color: '#E65100',
        label: 'Total',
      });
    return { labels: chart.years || [], datasets };
  }, [selectedCountry]);

  // --- availability flags ---
  const hasPieData = useMemo(
    () => pieData.some(d => d.population > 0),
    [pieData],
  );

  const hasLineData = useMemo(
    () =>
      (lineData.labels?.length || 0) > 0 &&
      (lineData.datasets?.length || 0) > 0,
    [lineData],
  );

  const hasAnyChart = hasPieData || hasLineData;

  // Reset active tab when available data changes
  useEffect(() => {
    if (hasPieData) setActiveTab('age');
    else if (hasLineData) setActiveTab('time');
  }, [hasPieData, hasLineData]);

  if (loading) return <ActivityIndicator style={styles.center} size="large" />;
  if (error) return <Text style={styles.center}>{error}</Text>;
  if (!selectedCountry)
    return <Text style={styles.center}>No data available</Text>;

  const { name, region, indicators } = selectedCountry;
  const population = indicators?.['1'];
  const incomeGroup = indicators?.['2'];
  const fatalities = indicators?.['3'];
  const deathRate = indicators?.['4'];
  const reportedFatalities = indicators?.['5'];
  const dataSource = indicators?.['6'];

  return (
    <ImageBackground
      source={require('../../assets/home_bg.png')}
      style={styles.headerBg}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image
              source={require('../../assets/goBack.png')}
              style={styles.icon}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <View style={styles.headerTitleWrapper}>
            <Text
              style={styles.headerTitle}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {name || 'Country'}
            </Text>
          </View>

          <TouchableOpacity onPress={handleToggleFavourite}>
            <Icon
              name={isFavourite ? 'star' : 'star-outline'}
              size={26}
              color="#fff"
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={[styles.content, styles.roundedContent]}
          contentContainerStyle={{ paddingBottom: 180 }}
        >
          <View style={styles.regionRow}>
            <Image
              source={require('../../assets/globe.png')}
              style={styles.regionIcon}
              resizeMode="contain"
            />
            <Text style={styles.region}>{region || 'Region'}</Text>
          </View>

          {/* Burden section */}
          <View style={styles.headerRow}>
            <Text style={styles.burdenText}>Burden</Text>

            {hasAnyChart && (
              <View style={styles.tabRow}>
                {hasPieData && (
                  <ChartTab
                    active={activeTab === 'age'}
                    icon={require('../../assets/pie_chart.png')}
                    label="Age group"
                    onPress={() => setActiveTab('age')}
                  />
                )}
                {hasLineData && (
                  <ChartTab
                    active={activeTab === 'time'}
                    icon={require('../../assets/trends_chart.png')}
                    label="Over time"
                    onPress={() => setActiveTab('time')}
                  />
                )}
              </View>
            )}
          </View>

          {/* Divider always visible */}
          <View style={styles.sectionDivider} />

          {/* Charts only when data exists */}
          {hasAnyChart && (
            <>
              {activeTab === 'age' && hasPieData && (
                <>
                  <Text style={styles.chartTitle}>
                    Drowning deaths by age group
                  </Text>
                  <MemoPieChart data={pieData} />
                </>
              )}

              {activeTab === 'time' && hasLineData && (
                <>
                  <Text style={styles.chartTitle}>
                    Drowning death rates over time
                  </Text>
                  <MemoLineChart
                    lineData={lineData}
                    width={screenWidth - 30}
                    height={chartHeight}
                  />
                </>
              )}
            </>
          )}

          <Text style={styles.dataSource}>
            WHO Global Health Estimate Data 2021
          </Text>
          {dataSource && (
            <Text style={styles.dataSourceExtra}>
              <Text style={{ fontWeight: '700' }}>Data Source: </Text>
              {dataSource}
            </Text>
          )}

          <View style={styles.cardGrid}>
            <MemoInfoCard
              icon={require('../../assets/population.png')}
              title="Total Population"
              value={population}
              bg="#D6F5EC"
            />
            <MemoInfoCard
              icon={require('../../assets/income_group.png')}
              title="Income Group"
              value={incomeGroup}
              bg="#EAF4D9"
            />
            <MemoInfoCard
              icon={require('../../assets/death_count.png')}
              title="WHO Estimated Fatalities"
              value={fatalities}
              bg="#FADDDD"
            />
            <MemoInfoCard
              icon={require('../../assets/death_rate.png')}
              title="WHO Estimated Death Rate"
              value={deathRate}
              bg="#F5E1D7"
            />
            <MemoInfoCard
              icon={require('../../assets/death_count.png')}
              title="Reported Fatalities"
              value={reportedFatalities}
              bg="#DCE8F9"
            />
            <MemoInfoCard
              icon={require('../../assets/source.png')}
              title="Source of national data"
              value={dataSource}
              bg="#FFF5D6"
              bold
            />
          </View>

          <TouchableOpacity
            style={styles.exploreBtn}
            onPress={() => navigation.navigate('Explore', { countryCode })}
          >
            <Text style={styles.exploreBtnText}>Explore Data</Text>
          </TouchableOpacity>

          <Text style={styles.noteText}>
            * Numbers of deaths have been rounded according to the following
            scheme: 100 rounded to nearest 1; 100-999 rounded to nearest 10;
            1000-9999 rounded to nearest 100; and 10 000 rounded to nearest 1000
          </Text>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

const ChartTab = React.memo(function ChartTab({
  active,
  icon,
  label,
  onPress,
}) {
  const iconStyle = useMemo(
    () => [styles.tabIcon, { tintColor: active ? '#fff' : '#0e4176' }],
    [active],
  );
  return (
    <TouchableOpacity
      style={[styles.tab, active && styles.activeTab]}
      onPress={onPress}
    >
      <Image source={icon} style={iconStyle} resizeMode="contain" />
      <Text style={active ? styles.tabTextActive : styles.tabText}>
        {label}
      </Text>
    </TouchableOpacity>
  );
});

const MemoLineChart = React.memo(function LineChart({
  lineData,
  width,
  height,
}) {
  const paddingLeft = 70;
  const paddingRight = 40;
  const paddingTop = 40;
  const paddingBottom = 50;

  const xScale = useMemo(
    () =>
      d3Scale
        .scalePoint()
        .domain(lineData.labels)
        .range([paddingLeft, width - paddingRight]),
    [lineData.labels, width],
  );

  const maxYValue = useMemo(() => {
    const all = lineData.datasets.flatMap(ds => ds.data);
    return Math.max(...(all.length ? all : [1]), 1);
  }, [lineData.datasets]);

  const yScale = useMemo(
    () =>
      d3Scale
        .scaleLinear()
        .domain([0, maxYValue])
        .range([height - paddingBottom, paddingTop]),
    [maxYValue, height],
  );

  const lineGenerator = useMemo(
    () =>
      d3Shape
        .line()
        .x((_, index) => xScale(lineData.labels[index]))
        .y(value => yScale(value))
        .curve(d3Shape.curveMonotoneX),
    [xScale, yScale, lineData.labels],
  );

  const pathRefs = useRef([]);
  const animations = useRef(
    lineData.datasets.map(() => new RNAnimated.Value(0)),
  ).current;
  const [pathLengths, setPathLengths] = useState(
    new Array(lineData.datasets.length).fill(0),
  );

  useEffect(() => {
    setTimeout(() => {
      const lengths = lineData.datasets.map((_, i) => {
        const ref = pathRefs.current[i];
        return ref && typeof ref.getTotalLength === 'function'
          ? ref.getTotalLength()
          : 0;
      });
      setPathLengths(lengths);
    }, 50);
  }, [lineData.datasets]);

  useEffect(() => {
    if (!pathLengths.length) return;
    RNAnimated.stagger(
      200,
      animations.map(anim =>
        RNAnimated.timing(anim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
      ),
    ).start();
  }, [pathLengths, animations]);

  const xLabelStep = lineData.labels.length
    ? Math.ceil(lineData.labels.length / 5)
    : 1;

  return (
    <>
      <Svg width={width} height={height}>
        <SvgText
          x={paddingLeft - 45}
          y={height / 2}
          fill="#333333d4"
          fontSize={12}
          fontWeight="400"
          textAnchor="middle"
          transform={`rotate(-90, ${paddingLeft - 45}, ${height / 2})`}
        >
          Rate (no. 100 000 population per year)
        </SvgText>

        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
          <Line
            key={`ygrid-${i}`}
            x1={paddingLeft}
            y1={paddingTop + t * (height - paddingTop - paddingBottom)}
            x2={width - paddingRight}
            y2={paddingTop + t * (height - paddingTop - paddingBottom)}
            stroke="#eee"
          />
        ))}

        {lineData.datasets.map((ds, i) => {
          const path = lineGenerator(ds.data);
          const dash = pathLengths[i] || 0;
          const dashOffset = animations[i].interpolate({
            inputRange: [0, 1],
            outputRange: [dash, 0],
          });
          return (
            <AnimatedPath
              key={i}
              d={path}
              stroke={ds.color}
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={dash}
              strokeDashoffset={dashOffset}
              ref={ref => (pathRefs.current[i] = ref)}
            />
          );
        })}
        {lineData.labels.map((label, i) => (
          <Line
            key={`xgrid-${i}`}
            x1={xScale(label)}
            y1={height - paddingBottom}
            x2={xScale(label)}
            y2={height - paddingBottom + 6}
            stroke="#333"
            strokeWidth={1}
          />
        ))}

        {lineData.labels.map(
          (label, i) =>
            i % xLabelStep === 0 && (
              <SvgText
                key={`xlabel-${i}`}
                x={xScale(label)}
                y={height - paddingBottom + 20}
                fontSize={12}
                fill="#333"
                textAnchor="middle"
              >
                {label}
              </SvgText>
            ),
        )}

        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const val = (maxY(lineData.datasets) * (1 - t)).toFixed(1);
          const y = paddingTop + t * (height - paddingTop - paddingBottom);
          return (
            <SvgText
              key={`ylabel-${i}`}
              x={paddingLeft - 15}
              y={y + 4}
              fontSize={12}
              fill="#333"
              textAnchor="end"
            >
              {val}
            </SvgText>
          );
        })}
      </Svg>

      <View style={styles.legendWrapper}>
        {lineData.datasets.map((ds, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: ds.color }]} />
            <Text style={styles.legendText}>{ds.label}</Text>
          </View>
        ))}
      </View>
    </>
  );
});

function maxY(datasets) {
  const all = datasets.flatMap(ds => ds.data);
  return Math.max(...(all.length ? all : [1]), 1);
}

const MemoPieChart = React.memo(function PieChart({ data }) {
  const progress = useRef(new RNAnimated.Value(0)).current;
  const [displayPaths, setDisplayPaths] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);

  const chartData = useMemo(() => data.filter(d => d.population > 0), [data]);

  const arcs = useMemo(
    () => d3Shape.pie().value(d => d.population)(chartData),
    [chartData],
  );

  const arcGenerator = useMemo(
    () =>
      d3Shape
        .arc()
        .outerRadius(160)
        .innerRadius(60)
        .cornerRadius(10)
        .padAngle(0.02),
    [],
  );

  useEffect(() => {
    const listenerId = progress.addListener(({ value }) => {
      const newPaths = arcs.map(arc => {
        const endAngle =
          arc.startAngle + (arc.endAngle - arc.startAngle) * value;
        return arcGenerator({ ...arc, endAngle });
      });
      setDisplayPaths(newPaths);
    });

    RNAnimated.timing(progress, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: false,
    }).start();

    setDisplayPaths(
      arcs.map(arc => arcGenerator({ ...arc, endAngle: arc.startAngle })),
    );

    return () => progress.removeListener(listenerId);
  }, [arcs, arcGenerator, progress]);

  const onToggle = useCallback(
    idx => setSelectedIndex(prev => (prev === idx ? null : idx)),
    [],
  );

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg height={360} width={screenWidth - 40}>
        <G x={(screenWidth - 40) / 2} y={180}>
          {arcs.map((arc, index) => {
            const isSelected = index === selectedIndex;
            const midAngle = (arc.startAngle + arc.endAngle) / 2;
            const offsetX = isSelected
              ? 12 * Math.cos(midAngle - Math.PI / 2)
              : 0;
            const offsetY = isSelected
              ? 12 * Math.sin(midAngle - Math.PI / 2)
              : 0;
            return (
              <G
                key={index}
                x={offsetX}
                y={offsetY}
                onPress={() => onToggle(index)}
              >
                <Path
                  d={
                    displayPaths[index] ||
                    arcGenerator({ ...arc, endAngle: arc.startAngle })
                  }
                  fill={chartData[index].color}
                />
              </G>
            );
          })}

          {selectedIndex !== null &&
            (() => {
              const arc = arcs[selectedIndex];
              const midAngle = (arc.startAngle + arc.endAngle) / 2;
              const x = Math.cos(midAngle - Math.PI / 2) * 120;
              const y = Math.sin(midAngle - Math.PI / 2) * 120;
              return (
                <G>
                  <Rect
                    x={x - 55}
                    y={y - 25}
                    width={110}
                    height={50}
                    rx={8}
                    ry={8}
                    fill="#fff"
                    stroke="#333"
                    strokeWidth={0.8}
                  />
                  <SvgText
                    x={x}
                    y={y - 5}
                    fontSize={12}
                    fontWeight="600"
                    fill="#333"
                    textAnchor="middle"
                  >
                    {chartData[selectedIndex].name}
                  </SvgText>
                  <SvgText
                    x={x}
                    y={y + 12}
                    fontSize={11}
                    fill="#555"
                    textAnchor="middle"
                  >
                    {chartData[selectedIndex].population}
                  </SvgText>
                </G>
              );
            })()}
        </G>
      </Svg>

      <View style={styles.legendWrapper}>
        <View style={styles.legendColumn}>
          {[0, 2, 4].map(i =>
            chartData[i] ? (
              <View key={i} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: chartData[i].color },
                  ]}
                />
                <Text style={styles.legendText}>{chartData[i].name}</Text>
              </View>
            ) : null,
          )}
        </View>
        <View style={styles.legendColumn}>
          {[1, 3, 5].map(i =>
            chartData[i] ? (
              <View key={i} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: chartData[i].color },
                  ]}
                />
                <Text style={styles.legendText}>{chartData[i].name}</Text>
              </View>
            ) : null,
          )}
        </View>
      </View>
    </View>
  );
});

const MemoInfoCard = React.memo(InfoCard);
function InfoCard({ icon, title, value, note, bg, bold }) {
  const textColor = useMemo(() => darkenColor(bg, 50), [bg]);
  return (
    <View style={[styles.card, { backgroundColor: bg }]}>
      <Image
        source={icon}
        style={[styles.cardIcon, { tintColor: textColor }]}
        resizeMode="contain"
      />
      <Text style={[styles.cardTitle, { color: textColor }]}>{title}</Text>
      <Text
        style={[
          bold ? styles.cardValueBold : styles.cardValue,
          { color: textColor },
        ]}
      >
        {value || 'N/A'}
      </Text>
      {note ? (
        <Text style={[styles.cardNote, { color: textColor }]}>{note}</Text>
      ) : null}
    </View>
  );
}

const darkenColor = (hex, percent = 40) => {
  if (!hex || !hex.startsWith('#')) return '#333';
  let num = parseInt(hex.replace('#', ''), 16);
  let amt = Math.round(2.55 * percent);
  let R = (num >> 16) - amt;
  let G = ((num >> 8) & 0x00ff) - amt;
  let B = (num & 0x0000ff) - amt;
  return (
    '#' +
    (
      0x1000000 +
      (R < 0 ? 0 : R > 255 ? 255 : R) * 0x10000 +
      (G < 0 ? 0 : G > 255 ? 255 : G) * 0x100 +
      (B < 0 ? 0 : B > 255 ? 255 : B)
    )
      .toString(16)
      .slice(1)
  );
};

const getAgeLabel = index =>
  [
    '0 to 4 years',
    '5 to 14 years',
    '15 to 29 years',
    '30 to 49 years',
    '50 to 69 years',
    '70+ years',
  ][index] || `Group ${index + 1}`;

const getAgeColor = index =>
  ['#2A9D8F', '#E9C46A', '#E76F51', '#6BAED6', '#F4A261', '#8D6E97'][index] ||
  '#ccc';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerBg: { width: '100%', height: '100%' },
  headerContent: {
    height: '11%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 35,
  },
  headerTitleWrapper: {
    flex: 1,
    marginHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  icon: { width: 24, height: 24, tintColor: '#fff' },
  content: { padding: 20, flex: 1, backgroundColor: '#fff' },
  regionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  regionIcon: { width: 18, height: 18, marginRight: 6 },
  region: { fontSize: 17, color: '#060606ff', fontWeight: '500' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 11,
  },
  burdenText: { fontSize: 22, fontWeight: '600', color: '#060606ff' },
  tabRow: { flexDirection: 'row' },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 17,
    marginLeft: 8,
    borderRadius: 16,
  },
  activeTab: { backgroundColor: '#0e4177f6' },
  tabIcon: { width: 15, height: 15, marginRight: 5 },
  tabText: { fontSize: 15, color: '#0e4177f6' },
  tabTextActive: { fontSize: 15, color: '#fff', fontWeight: '600' },
  chartTitle: {
    fontSize: 19,
    fontWeight: '600',
    marginBottom: 15,
    color: '#141313ff',
  },
  legendWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  legendColumn: { marginHorizontal: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  legendLine: { width: 20, height: 3, borderRadius: 2, marginRight: 6 },
  legendText: { fontSize: 14, color: '#333' },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 6 },
  dataSource: {
    fontSize: 15,
    color: '#1a1a1ae5',
    marginTop: 5,
    textAlign: 'center',
    fontWeight: '600',
  },
  dataSourceExtra: {
    fontSize: 16,
    color: '#444',
    marginTop: 10,
    fontWeight: '400',
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  card: { width: '47%', borderRadius: 12, padding: 16, marginBottom: 15 },
  cardIcon: { width: 24, height: 24, marginBottom: 8 },
  cardTitle: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  cardValue: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  cardValueBold: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  cardNote: { fontSize: 12, fontWeight: '400', opacity: 0.7 },
  exploreBtn: {
    backgroundColor: '#0e4177f6',
    paddingVertical: 8,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignSelf: 'center',
    alignItems: 'center',
    marginTop: 20,
    minWidth: 150,
  },
  exploreBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  noteText: {
    fontSize: 12,
    color: '#444',
    marginTop: 15,
    textAlign: 'center',
    paddingHorizontal: 15,
    marginBottom: 60,
  },
  navWrapper: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  sectionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginVertical: 15,
  },
  roundedContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
});
