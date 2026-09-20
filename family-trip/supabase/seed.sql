-- 예시 데이터: 날짜·시간·좌표는 실제 계획에 맞게 고쳐 쓰세요.
insert into days (n, city, title, moves) values
 (1, '상하이', '상하이 도착', '[{"kind":"plane","text":"인천 → 상하이"},{"kind":"hotel","text":"호텔 체크인"}]'),
 (2, '상하이', '쇼핑을 합시당', '[]'),
 (3, '항저우', '항저우로 이동', '[{"kind":"train","text":"상하이 → 항저우 고속철"},{"kind":"hotel","text":"항저우 숙소로 이동"}]'),
 (4, '항저우', '항저우 시내', '[]'),
 (5, '귀국', '집으로', '[{"kind":"hotel","text":"체크아웃"},{"kind":"plane","text":"귀국"}]')
on conflict (n) do nothing;

with d as (select id from days where n = 2)
insert into blocks (day_id, position, type, name, zh_name, start_time, duration_text, duration_min, memo, important, todos, reservation)
select d.id, v.position, v.type, v.name, v.zh_name, v.start_time, v.duration_text, v.duration_min, v.memo, v.important, v.todos::jsonb, v.reservation::jsonb
from d, (values
 (0, 'tour', '위위안', '豫园', '10:00', '2시간', 120, '구곡교에서 가족사진', false, '[]', null),
 (1, 'food', '난샹만두점', '南翔馒头店', '12:10', '1시간', 60, '샤오룽바오 먼저 주문하기', false, '[]', null),
 (2, 'tour', '상하이 박물관', '上海博物馆', '13:40', '2시간', 120, '보고 싶은 전시 정해두기', true,
    '[{"id":"a","text":"여권 챙기기","done":true},{"id":"b","text":"보고 싶은 전시 정하기","done":false}]',
    '{"owner":"안윤진","status":"예약 완료"}'),
 (3, 'shop', '난징둥루', '南京东路', '16:00', '2시간', 120, '기념품 구경', false, '[]', null),
 (4, 'tour', '황푸강 유람선', '黄浦江游船', '19:00', '1시간', 60, '선착장에 미리 도착하기', true, '[]', '{"owner":"안윤진","status":"예약 완료"}')
) as v(position, type, name, zh_name, start_time, duration_text, duration_min, memo, important, todos, reservation);
