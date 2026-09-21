// 크게 보여주는 중국어 카드
export type Phrase = {
  id: string;
  ko: string;          // 한국어 뜻
  zh: string;          // 보여줄 중국어
  yin: string;         // 한글로 적은 발음
  icon: string;        // 아이콘 path (lib/icons의 CARD_ICONS 키)
  note?: string;       // 쓸 때 참고
};
export type PhraseGroup = { id: string; label: string; items: Phrase[] };

export const PHRASES: PhraseGroup[] = [
  {
    id: 'allergy',
    label: '알레르기',
    items: [
      { id: 'milk', ko: '우유 알레르기가 있어요', zh: '我对牛奶过敏，请不要加牛奶和奶制品。', yin: '워 뛔이 니우나이 꿔민, 칭 부야오 지아 니우나이 허 나이짐핀', icon: 'milk', note: '버터·치즈·연유도 奶制品에 들어가요' },
      { id: 'shell', ko: '갑각류 알레르기가 있어요', zh: '我对甲壳类海鲜过敏（虾、蟹）。请不要放。', yin: '워 뛔이 지아커레이 하이시엔 꿔민 (시아, 시에). 칭 부야오 팡', icon: 'crab', note: '새우(虾)·게(蟹)가 들어간 육수도 빼달라고 하면 좋아요' },
      { id: 'serious', ko: '심한 알레르기예요. 꼭 빼주세요', zh: '这是严重过敏，吃了会很危险。请一定不要放。', yin: '쩌스 옌중 꿔민, 츨러 후이 헌 웨이시엔. 칭 이딩 부야오 팡', icon: 'alert' },
      { id: 'hospital', ko: '알레르기 반응이 왔어요. 병원에 가야 해요', zh: '他过敏了，需要马上去医院。请帮我叫救护车。', yin: '타 꿔민러, 쉬야오 마상 취 이위엔. 칭 빵 워 지아오 지우후처', icon: 'alert', note: '중국 응급 전화는 120이에요' },
      { id: 'nut', ko: '견과류·땅콩 알레르기가 있어요', zh: '我对坚果和花生过敏。', yin: '워 뛔이 지엔궈 허 화성 꿔민', icon: 'nut' },
    ],
  },
  {
    id: 'order',
    label: '주문할 때',
    items: [
      { id: 'notspicy', ko: '맵지 않게 해주세요', zh: '请不要放辣椒，不要辣。', yin: '칭 부야오 팡 라지아오, 부야오 라', icon: 'food' },
      { id: 'noherb', ko: '고수 빼주세요', zh: '不要香菜，谢谢。', yin: '부야오 샹차이, 셰셰', icon: 'food' },
      { id: 'this', ko: '이거 주세요', zh: '我要这个。', yin: '워 야오 쩌거', icon: 'food' },
      { id: 'water', ko: '따뜻한 물 주세요', zh: '请给我一杯温水。', yin: '칭 게이 워 이베이 원수이', icon: 'food' },
      { id: 'pack', ko: '포장해 주세요', zh: '打包，谢谢。', yin: '다바오, 셰셰', icon: 'food' },
      { id: 'bill', ko: '계산할게요', zh: '服务员，买单。', yin: '푸우위엔, 마이단', icon: 'money' },
    ],
  },
  {
    id: 'pay',
    label: '계산·쇼핑',
    items: [
      { id: 'howmuch', ko: '얼마예요?', zh: '多少钱？', yin: '뚜오사오 치엔', icon: 'money' },
      { id: 'alipay', ko: '알리페이로 결제할 수 있나요?', zh: '可以用支付宝吗？', yin: '커이 융 즈푸바오 마', icon: 'money' },
      { id: 'card', ko: '외국 카드 되나요?', zh: '可以刷外国信用卡吗？', yin: '커이 수아 와이궈 신융카 마', icon: 'money' },
      { id: 'cheaper', ko: '좀 싸게 해주세요', zh: '能便宜一点吗？', yin: '넝 피엔이 이디엔 마', icon: 'money' },
    ],
  },
  {
    id: 'move',
    label: '길·이동',
    items: [
      { id: 'toilet', ko: '화장실이 어디예요?', zh: '请问厕所在哪里？', yin: '칭원 처수오 짜이 나리', icon: 'wc' },
      { id: 'metro', ko: '지하철역이 어디예요?', zh: '请问地铁站在哪里？', yin: '칭원 띠티에잔 짜이 나리', icon: 'subway' },
      { id: 'taxi', ko: '여기로 가주세요', zh: '请带我去这里。', yin: '칭 다이 워 취 쩌리', icon: 'car', note: '택시 화면의 주소 카드를 같이 보여주세요' },
      { id: 'photo', ko: '사진 좀 찍어주시겠어요?', zh: '可以帮我们拍张照吗？', yin: '커이 빵 워먼 파이장짜오 마', icon: 'camera' },
      { id: 'english', ko: '영어 할 줄 아세요?', zh: '你会说英语吗？', yin: '니 후이 수오 잉위 마', icon: 'help' },
    ],
  },
  {
    id: 'help',
    label: '도움이 필요할 때',
    items: [
      { id: 'helpme', ko: '도와주세요', zh: '请帮帮我。', yin: '칭 빵빵 워', icon: 'help' },
      { id: 'pharmacy', ko: '근처에 약국이 있나요?', zh: '附近有药店吗？', yin: '푸진 여우 야오디엔 마', icon: 'alert' },
      { id: 'lost', ko: '길을 잃었어요. 이 호텔로 가려고 해요', zh: '我迷路了，我要去这家酒店。', yin: '워 미루러, 워 야오 취 쩌지아 지우디엔', icon: 'help' },
    ],
  },
];
