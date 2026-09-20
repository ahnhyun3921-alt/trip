// 상하이 지하철 역내 화장실 (상하이 지하철 공식 안내 기준, 2024-10-21)
// 여행 동선 근처 역만 골라 담았어요. 필요한 역은 같은 형식으로 더 넣으면 돼요.
// in: 개찰구 안(표를 찍고 들어가야 씀) · out: 개찰구 밖 · street: 역 밖 공중/상가 화장실
export type MetroToilet = { line: string; where: string; gate: 'in' | 'out' | 'both' | 'street'; accessible?: boolean };
export type MetroStation = { zh: string; ko: string; alias?: string[]; toilets: MetroToilet[] };

const t = (line: string, gate: MetroToilet['gate'], where: string, accessible = true): MetroToilet => ({ line, gate, where, accessible });

export const METRO_TOILETS: MetroStation[] = [
  { zh: '人民广场', ko: '런민광장', toilets: [t('1', 'in', 'B방향 승강장 끝'), t('2', 'in', 'A방향 승강장 끝'), t('8', 'in', 'A방향 승강장 끝')] },
  { zh: '南京东路', ko: '난징둥루', toilets: [t('2', 'in', 'A방향 승강장 끝'), t('10', 'out', '북쪽 끝, 6번 출구 근처')] },
  { zh: '南京西路', ko: '난징시루', toilets: [t('2', 'in', 'A방향 승강장 끝'), t('12', 'out', '13번 출구 근처'), t('13', 'out', '8번 출구 근처')] },
  { zh: '豫园', ko: '위위안', toilets: [t('10', 'out', '3번 출구 근처'), t('14', 'in', 'B방향 승강장 앞')] },
  { zh: '陆家嘴', ko: '루자쭈이', toilets: [t('2', 'in', 'A방향 승강장 끝'), t('14', 'in', 'A방향 승강장 앞')] },
  { zh: '一大会址·新天地', ko: '신톈디', alias: ['新天地'], toilets: [t('10', 'out', '6번 출구 근처'), t('13', 'out', '6번 출구 근처')] },
  { zh: '一大会址·黄陂南路', ko: '황피난루', alias: ['黄陂南路'], toilets: [t('1', 'in', 'A방향 승강장 끝'), t('14', 'in', 'B방향 승강장 끝')] },
  { zh: '静安寺', ko: '징안쓰', toilets: [t('2', 'in', 'A방향 승강장 끝'), t('7', 'in', '8·9번 출구 고객센터 뒤'), t('14', 'in', 'B방향 승강장 끝')] },
  { zh: '陕西南路', ko: '산시난루', toilets: [t('1', 'in', 'B방향 승강장 끝'), t('10', 'out', '7번 출구 근처'), t('12', 'in', 'A방향 승강장 끝')] },
  { zh: '常熟路', ko: '창수루', toilets: [t('1', 'in', 'B방향 승강장 끝'), t('7', 'out', '6번 출구 근처')] },
  { zh: '徐家汇', ko: '쉬자후이', toilets: [t('1', 'in', 'B방향 승강장 끝'), t('9', 'out', '17번 출구 근처'), t('11', 'both', '1·9호선 역내 화장실')] },
  { zh: '老西门', ko: '라오시먼', toilets: [t('8', 'in', 'A방향 승강장 끝'), t('10', 'out', '6번 출구 근처')] },
  { zh: '大世界', ko: '다스제', toilets: [t('8', 'in', '14호선 화장실 근처'), t('14', 'in', 'A방향 승강장 앞')] },
  { zh: '天潼路', ko: '톈퉁루', toilets: [t('10', 'in', '3번 출구 근처'), t('12', 'in', '10호선 승강장, 3번 출구 근처')] },
  { zh: '汉中路', ko: '한중루', toilets: [t('1', 'out', '10번 출구 근처'), t('12', 'out', '10번 출구 근처'), t('13', 'out', '10번 출구 근처')] },
  { zh: '淮海中路', ko: '화이하이중루', toilets: [t('13', 'out', '1번 출구 근처')] },
  { zh: '自然博物馆', ko: '자연박물관', toilets: [t('13', 'out', '1번 출구 근처')] },
  { zh: '小南门', ko: '샤오난먼', toilets: [t('9', 'in', 'B방향 승강장 앞')] },
  { zh: '商城路', ko: '상청루', toilets: [t('9', 'out', '1번 출구 근처')] },
  { zh: '陆家浜路', ko: '루자방루', toilets: [t('8', 'out', '7번 출구 대합실'), t('9', 'out', '7번 출구 근처')] },
  { zh: '马当路', ko: '마당루', toilets: [t('9', 'out', '3번 출구 근처 KFC 화장실', false), t('13', 'street', '3번 출구 KFC 화장실', false)] },
  { zh: '打浦桥', ko: '다푸차오(톈쯔팡)', toilets: [t('9', 'out', '백화점 화장실', false)] },
  { zh: '西藏南路', ko: '시짱난루', toilets: [t('4', 'in', '8호선 승강장 B방향 끝'), t('8', 'in', 'A방향 승강장 끝')] },
  { zh: '中华艺术宫', ko: '중화예술궁', toilets: [t('8', 'in', 'A방향 승강장 끝')] },
  { zh: '国际客运中心', ko: '국제여객센터(북와이탄)', toilets: [t('12', 'out', '1번 출구 근처')] },
  { zh: '上海图书馆', ko: '상하이도서관(우캉루)', toilets: [t('10', 'out', '1번 출구 근처')] },
  { zh: '交通大学', ko: '교통대학', toilets: [t('10', 'out', '5번 출구 근처'), t('11', 'out', '10호선 역내 5번 출구')] },
  { zh: '世纪大道', ko: '세기대로', toilets: [t('2', 'in', '6호선 쪽 승강장 끝'), t('4', 'in', '6호선 동방체육중심 방향 승강장 끝'), t('6', 'in', 'A방향 승강장 끝, B방향 승강장 앞'), t('9', 'in', '6호선 승강장 양쪽 끝')] },
  { zh: '东昌路', ko: '둥창루', toilets: [t('2', 'in', 'A방향 승강장 끝')] },
  { zh: '浦东南路', ko: '푸둥난루', toilets: [t('14', 'in', 'A방향 승강장 앞')] },
  { zh: '上海科技馆', ko: '상하이과기관', toilets: [t('2', 'in', 'A방향 승강장 끝')] },
  { zh: '世纪公园', ko: '세기공원', toilets: [t('2', 'in', 'A방향 승강장 끝')] },
  { zh: '龙阳路', ko: '룽양루(자기부상열차)', toilets: [t('2', 'in', 'A방향 승강장 끝'), t('7', 'in', '환승 통로 출구 근처'), t('16', 'in', '1호선 환승 통로, 서쪽 관리실 근처'), t('18', 'in', 'A방향 승강장 앞')] },
  { zh: '上海火车站', ko: '상하이역', toilets: [t('1', 'in', 'B방향 승강장 끝'), t('3', 'in', 'A방향 승강장 끝', false), t('4', 'in', 'B방향 승강장 끝', false)] },
  { zh: '虹桥火车站', ko: '훙차오역', toilets: [t('2', 'in', 'A방향 승강장 끝'), t('10', 'in', '2호선 A방향 승강장 끝'), t('17', 'in', '2호선 A방향 승강장 앞')] },
  { zh: '虹桥2号航站楼', ko: '훙차오공항 T2', toilets: [t('2', 'street', '공항 화장실', false), t('10', 'street', '공항 화장실', false)] },
  { zh: '浦东国际机场', ko: '푸둥공항', toilets: [t('2', 'street', '공항 화장실', false)] },
  { zh: '迪士尼', ko: '디즈니', toilets: [t('11', 'in', 'B방향 승강장 끝')] },
];

export const GATE_LABEL: Record<MetroToilet['gate'], string> = { in: '개찰구 안', out: '개찰구 밖', both: '개찰구 안·밖', street: '역 밖' };

// 고덕 POI 이름('豫园(地铁站)', '豫园地铁站', '豫园站')을 표의 역과 맞추기
export function matchStation(poiName: string): MetroStation | null {
  const clean = poiName.replace(/\(.*?\)|（.*?）/g, '').replace(/地铁站$|站$/, '').trim();
  return METRO_TOILETS.find((s) => s.zh === clean || s.alias?.includes(clean) || clean.startsWith(s.zh)) ?? null;
}

export function searchStations(q: string): MetroStation[] {
  const k = q.trim();
  if (!k) return METRO_TOILETS;
  return METRO_TOILETS.filter((s) => s.zh.includes(k) || s.ko.includes(k) || s.alias?.some((a) => a.includes(k)));
}
