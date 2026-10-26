-- Apply after migration 001. Re-runnable; does not delete wishes or create emergency wishes.
begin;
alter table public.wishes add column if not exists source text not null default 'guest'
  check (source in ('guest','emergency'));

create table if not exists public.emergency_samples (
  id integer primary key check (id between 1 and 120),
  recipient text not null check (char_length(recipient) between 1 and 60),
  message text not null check (char_length(message) between 10 and 500)
);
create table if not exists public.emergency_cursor (
  singleton boolean primary key default true check (singleton),
  next_index bigint not null default 0
);
create table if not exists public.admin_operations (
  request_id uuid primary key,
  actor uuid not null,
  action text not null check (action in ('emergency','delete_all')),
  result_count integer not null,
  created_at timestamptz not null default now()
);
alter table public.emergency_samples enable row level security;
alter table public.emergency_cursor enable row level security;
alter table public.admin_operations enable row level security;
revoke all on public.emergency_samples, public.emergency_cursor, public.admin_operations from public, anon, authenticated;

insert into public.emergency_cursor(singleton,next_index) values(true,0) on conflict do nothing;
insert into public.emergency_samples(id,recipient,message) values
(1,'Con yêu','Ba mẹ tin con sẽ tìm thấy niềm vui trên hành trình học tập.'),
(2,'Con yêu','Mỗi điều con học được đều là một bước tiến khiến ba mẹ vui.'),
(3,'Con yêu','Ba mẹ mong con học bằng sự tò mò và lòng yêu thích.'),
(4,'Con yêu','Điểm số không nói hết giá trị của con trong lòng ba mẹ.'),
(5,'Con yêu','Ba mẹ tự hào khi thấy con kiên nhẫn với một bài học khó.'),
(6,'Con yêu','Con cứ mạnh dạn hỏi, ba mẹ luôn trân trọng tinh thần ham học.'),
(7,'Con yêu','Ba mẹ chúc con tìm được những người thầy truyền cảm hứng.'),
(8,'Con yêu','Mong con giữ đôi mắt tò mò với thế giới, ba mẹ luôn ủng hộ.'),
(9,'Con yêu','Ba mẹ vui vì con đang học cách tự giải quyết vấn đề.'),
(10,'Con yêu','Mỗi lần con hiểu thêm một điều mới, ba mẹ cũng thấy hạnh phúc.'),
(11,'Con yêu','Ba mẹ mong con học để hiểu mình và giúp ích cho mọi người.'),
(12,'Con yêu','Con không cần biết hết mọi thứ, ba mẹ chỉ mong con chịu học.'),
(13,'Con yêu','Ba mẹ tin những ngày chăm chỉ hôm nay sẽ giúp con vững vàng.'),
(14,'Con yêu','Mong con tìm được cách học phù hợp với mình, ba mẹ luôn lắng nghe.'),
(15,'Con yêu','Ba mẹ tự hào khi con biết nhận lỗi và học từ điều chưa đúng.'),
(16,'Con yêu','Con hãy học từng chút một, ba mẹ tin vào sự bền bỉ của con.'),
(17,'Con yêu','Ba mẹ chúc con có những giờ học nhiều khám phá và tiếng cười.'),
(18,'Con yêu','Mong con tìm thấy điều mình yêu thích giữa những bài học, ba mẹ tin con.'),
(19,'Con yêu','Ba mẹ vui khi thấy con biết dành thời gian cho việc học của mình.'),
(20,'Con yêu','Con cứ tiếp tục khám phá, ba mẹ sẽ cùng con học những điều mới.'),
(21,'Con yêu','Ba mẹ nhìn thấy những cố gắng thầm lặng của con mỗi ngày.'),
(22,'Con yêu','Dù kết quả ra sao, ba mẹ vẫn tự hào về sự nỗ lực của con.'),
(23,'Con yêu','Con đã đi xa hơn mình nghĩ, ba mẹ mong con biết ghi nhận bản thân.'),
(24,'Con yêu','Ba mẹ tin một bước nhỏ hôm nay cũng đáng được trân trọng.'),
(25,'Con yêu','Khi con muốn thử lại, ba mẹ luôn sẵn lòng cổ vũ.'),
(26,'Con yêu','Ba mẹ tự hào vì con đã không bỏ cuộc trước điều khó.'),
(27,'Con yêu','Con có thể đi chậm, ba mẹ vẫn vui khi thấy con tiến bước.'),
(28,'Con yêu','Ba mẹ biết có những ngày con đã cố gắng rất nhiều.'),
(29,'Con yêu','Mong con tự hào về từng tiến bộ nhỏ như ba mẹ tự hào về con.'),
(30,'Con yêu','Con không cần giỏi hơn ai, ba mẹ mong con lớn lên theo cách của mình.'),
(31,'Con yêu','Ba mẹ tin sự chăm chỉ của con đang âm thầm tạo nên thay đổi.'),
(32,'Con yêu','Những lần con đứng dậy sau vấp ngã đều khiến ba mẹ cảm phục.'),
(33,'Con yêu','Ba mẹ thương cả những ngày con chưa làm được điều mình mong muốn.'),
(34,'Con yêu','Con cứ kiên trì với điều có ý nghĩa, ba mẹ sẽ đồng hành.'),
(35,'Con yêu','Ba mẹ mong con nhìn lại để thấy mình đã trưởng thành thế nào.'),
(36,'Con yêu','Mỗi lần con dám bắt đầu là một lần ba mẹ thấy con can đảm.'),
(37,'Con yêu','Ba mẹ tin con sẽ học được nhiều điều từ cả thành công lẫn thất bại.'),
(38,'Con yêu','Con đừng quên khen mình sau một ngày cố gắng, ba mẹ cũng vậy.'),
(39,'Con yêu','Ba mẹ trân trọng sự nghiêm túc con dành cho điều mình lựa chọn.'),
(40,'Con yêu','Con đã làm tốt trong khả năng hôm nay, ba mẹ ghi nhận điều đó.'),
(41,'Con yêu','Ba mẹ mong con khỏe mạnh, ăn đủ bữa và ngủ thật ngon.'),
(42,'Con yêu','Khi mệt, con hãy nghỉ một chút, ba mẹ không mong con quá sức.'),
(43,'Con yêu','Ba mẹ mong con bình an hơn là phải luôn dẫn đầu.'),
(44,'Con yêu','Con không cần hoàn hảo để được ba mẹ yêu thương.'),
(45,'Con yêu','Ba mẹ luôn sẵn lòng nghe con kể về một ngày không vui.'),
(46,'Con yêu','Mong con biết chăm sóc mình như cách ba mẹ luôn thương con.'),
(47,'Con yêu','Ba mẹ chúc con có những ngày nhẹ lòng và nhiều tiếng cười.'),
(48,'Con yêu','Con có quyền nói mình đang buồn, ba mẹ sẽ lắng nghe.'),
(49,'Con yêu','Ba mẹ mong con dành thời gian cho những điều khiến mình thấy dễ chịu.'),
(50,'Con yêu','Dù hôm nay con thấy thế nào, ba mẹ vẫn luôn yêu con.'),
(51,'Con yêu','Ba mẹ chúc con đủ bình tĩnh để bước qua những ngày nhiều lo lắng.'),
(52,'Con yêu','Con hãy nhớ uống nước và giữ sức khỏe, ba mẹ luôn quan tâm.'),
(53,'Con yêu','Ba mẹ mong con giữ cho mình những khoảng nghỉ thật bình yên.'),
(54,'Con yêu','Con không phải giấu mọi khó khăn, ba mẹ luôn ở đây để nghe.'),
(55,'Con yêu','Ba mẹ vui khi con biết chọn điều phù hợp với sức mình.'),
(56,'Con yêu','Mong con biết dịu dàng với bản thân, ba mẹ thương con rất nhiều.'),
(57,'Con yêu','Ba mẹ chúc con một sớm mai nhiều năng lượng và một tối ngủ yên.'),
(58,'Con yêu','Con có thể nhờ giúp đỡ khi cần, ba mẹ sẽ cùng con tìm cách.'),
(59,'Con yêu','Ba mẹ mong con tìm được niềm vui trong những điều giản dị.'),
(60,'Con yêu','Sức khỏe và nụ cười của con luôn là điều ba mẹ quý nhất.'),
(61,'Con yêu','Ba mẹ tin con có quyền ước mơ và chọn con đường của mình.'),
(62,'Con yêu','Con cứ thử điều mình yêu thích, ba mẹ sẽ nghe con chia sẻ.'),
(63,'Con yêu','Ba mẹ chúc con đủ can đảm bước vào những trải nghiệm mới.'),
(64,'Con yêu','Mong con theo đuổi ước mơ bằng những bước nhỏ, ba mẹ tin con.'),
(65,'Con yêu','Ba mẹ không chọn thay con, nhưng luôn sẵn lòng cùng con suy nghĩ.'),
(66,'Con yêu','Con có thể đổi hướng khi hiểu mình hơn, ba mẹ sẽ lắng nghe.'),
(67,'Con yêu','Ba mẹ mong con tìm được công việc có ý nghĩa với mình.'),
(68,'Con yêu','Dù con chọn lối đi nào, ba mẹ mong con đi bằng sự tử tế.'),
(69,'Con yêu','Ba mẹ tin những sở thích nhỏ hôm nay có thể mở ra điều tốt đẹp.'),
(70,'Con yêu','Con đừng sợ bắt đầu từ điều nhỏ, ba mẹ luôn cổ vũ.'),
(71,'Con yêu','Ba mẹ chúc con gặp những cơ hội phù hợp và biết nắm lấy chúng.'),
(72,'Con yêu','Mong con dám nói về điều mình muốn, ba mẹ sẽ dành thời gian nghe.'),
(73,'Con yêu','Ba mẹ tự hào khi con biết suy nghĩ kỹ trước mỗi lựa chọn.'),
(74,'Con yêu','Con không cần có mọi câu trả lời hôm nay, ba mẹ hiểu điều đó.'),
(75,'Con yêu','Ba mẹ chúc con tìm được nhịp đi của riêng mình.'),
(76,'Con yêu','Mong con giữ sự tò mò khi bước ra thế giới, ba mẹ luôn bên con.'),
(77,'Con yêu','Ba mẹ tin con sẽ dần nhận ra điều thật sự quan trọng với mình.'),
(78,'Con yêu','Con cứ vững tâm trước chặng đường mới, ba mẹ sẽ là hậu phương.'),
(79,'Con yêu','Ba mẹ mong con được sống với điều mình yêu và tin tưởng.'),
(80,'Con yêu','Mỗi ước mơ con kể đều được ba mẹ lắng nghe bằng cả tấm lòng.'),
(81,'Con yêu','Nhà luôn sẵn một vòng tay của ba mẹ sau mọi hành trình của con.'),
(82,'Con yêu','Ba mẹ mong có thêm nhiều bữa cơm được nghe con kể chuyện.'),
(83,'Con yêu','Dù con đi xa đến đâu, tình thương của ba mẹ vẫn ở bên.'),
(84,'Con yêu','Ba mẹ cảm ơn con đã mang đến cho mái nhà nhiều tiếng cười.'),
(85,'Con yêu','Con lớn đến đâu vẫn luôn có một chỗ bình yên bên ba mẹ.'),
(86,'Con yêu','Ba mẹ mong gia đình mình luôn dành thời gian lắng nghe nhau.'),
(87,'Con yêu','Khi nhớ nhà, con cứ gọi, ba mẹ luôn muốn nghe giọng con.'),
(88,'Con yêu','Ba mẹ trân trọng từng khoảnh khắc được đồng hành cùng con.'),
(89,'Con yêu','Con không cần mang thành tích về nhà, ba mẹ mong được gặp con.'),
(90,'Con yêu','Ba mẹ mong con biết rằng mình luôn được chào đón trở về.'),
(91,'Con yêu','Cảm ơn con đã dạy ba mẹ thêm nhiều điều về yêu thương.'),
(92,'Con yêu','Ba mẹ mong được cùng con tạo thêm những kỷ niệm giản dị.'),
(93,'Con yêu','Dù lịch trình bận rộn, ba mẹ vẫn luôn dành một khoảng cho con.'),
(94,'Con yêu','Con cứ kể cả chuyện vui lẫn chuyện buồn, ba mẹ muốn hiểu con hơn.'),
(95,'Con yêu','Ba mẹ thương những thay đổi nhỏ của con trên đường trưởng thành.'),
(96,'Con yêu','Mong con luôn nhớ có ba mẹ ở phía sau mỗi bước đi.'),
(97,'Con yêu','Ba mẹ mong căn nhà này luôn là nơi con được là chính mình.'),
(98,'Con yêu','Con không cần mạnh mẽ mọi lúc khi ở cạnh ba mẹ.'),
(99,'Con yêu','Ba mẹ hạnh phúc khi thấy con tìm được những niềm vui riêng.'),
(100,'Con yêu','Mong mỗi lần trở về đều cho con thêm bình yên, ba mẹ luôn đợi.'),
(101,'Con yêu','Ba mẹ mong con sống tử tế và biết quan tâm đến người bên cạnh.'),
(102,'Con yêu','Con hãy giữ lời hứa từ những việc nhỏ, ba mẹ tin ở con.'),
(103,'Con yêu','Ba mẹ tự hào khi con biết cảm ơn và nói lời xin lỗi.'),
(104,'Con yêu','Mong con chọn sự chân thành trong những mối quan hệ, ba mẹ tin con.'),
(105,'Con yêu','Ba mẹ chúc con có những người bạn biết lắng nghe và tôn trọng nhau.'),
(106,'Con yêu','Con hãy giúp đỡ trong khả năng của mình, ba mẹ sẽ cùng con sẻ chia.'),
(107,'Con yêu','Ba mẹ mong con biết tôn trọng những điều khác biệt ở mỗi người.'),
(108,'Con yêu','Sự tử tế của con làm ba mẹ thấy ấm lòng.'),
(109,'Con yêu','Ba mẹ chúc con đủ tự tin để nói không với điều không phù hợp.'),
(110,'Con yêu','Mong con giữ lòng biết ơn mà vẫn biết bảo vệ mình, ba mẹ thương con.'),
(111,'Con yêu','Ba mẹ tự hào khi con dám nhận trách nhiệm về lựa chọn của mình.'),
(112,'Con yêu','Con hãy lắng nghe trước khi phán xét, đó là điều ba mẹ cùng con học.'),
(113,'Con yêu','Ba mẹ mong con xây dựng tình bạn bằng sự chân thành và tin cậy.'),
(114,'Con yêu','Mỗi việc tốt nhỏ con làm đều có ý nghĩa, ba mẹ tin điều đó.'),
(115,'Con yêu','Ba mẹ chúc con biết yêu thương mà không quên tôn trọng bản thân.'),
(116,'Con yêu','Mong con giữ sự khiêm tốn khi thành công, ba mẹ luôn nhắc mình như vậy.'),
(117,'Con yêu','Ba mẹ mong con biết vui cho hạnh phúc của những người quanh mình.'),
(118,'Con yêu','Con hãy sống thật với điều mình tin là đúng, ba mẹ sẽ lắng nghe.'),
(119,'Con yêu','Ba mẹ tự hào về trái tim biết quan tâm và sẻ chia của con.'),
(120,'Con yêu','Mong con lớn lên vững vàng và ấm áp, ba mẹ luôn yêu con.')
on conflict(id) do update set recipient=excluded.recipient,message=excluded.message;

create or replace function public.admin_emergency_wishes(p_request_id uuid)
returns integer language plpgsql security definer set search_path = ''
as $$
declare
  batch_count integer;
  start_index bigint;
  batch_time timestamptz;
  previous public.admin_operations%rowtype;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'ADMIN_REQUIRED' using errcode='42501';
  end if;
  if p_request_id is null then raise exception 'REQUEST_ID_REQUIRED'; end if;
  perform pg_advisory_xact_lock(23399,120);
  select * into previous from public.admin_operations where request_id=p_request_id;
  if found then
    if previous.actor<>auth.uid() or previous.action<>'emergency' then raise exception 'REQUEST_ID_CONFLICT'; end if;
    return previous.result_count;
  end if;
  if (select count(*) from public.emergency_samples)<>120 then raise exception 'SAMPLES_NOT_READY'; end if;
  select next_index into start_index from public.emergency_cursor where singleton=true for update;
  batch_count:=30+floor(random()*11)::integer;
  select greatest(clock_timestamp(),coalesce(max(created_at)+interval '1 millisecond',clock_timestamp()))
    into batch_time from public.wishes;
  insert into public.wishes(id,name,recipient,message,color,status,source,created_at)
  select gen_random_uuid(),'EIU Parent Day',s.recipient,s.message,
    (array['green','gold','pink','sage'])[(i%4)+1],'approved','emergency',batch_time+i*interval '1 millisecond'
  from generate_series(0,batch_count-1) as i
  join public.emergency_samples s on s.id=((start_index+i)%120)::integer+1;
  update public.emergency_cursor set next_index=(start_index+batch_count)%120 where singleton=true;
  insert into public.admin_operations(request_id,actor,action,result_count)
  values(p_request_id,auth.uid(),'emergency',batch_count);
  return batch_count;
end;
$$;

create or replace function public.admin_delete_all_wishes(p_request_id uuid,p_confirmation text)
returns integer language plpgsql security definer set search_path = ''
as $$
declare
  deleted_count integer;
  previous public.admin_operations%rowtype;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'ADMIN_REQUIRED' using errcode='42501';
  end if;
  if p_confirmation is distinct from 'DELETE_ALL_WISHES' then raise exception 'CONFIRMATION_REQUIRED'; end if;
  if p_request_id is null then raise exception 'REQUEST_ID_REQUIRED'; end if;
  perform pg_advisory_xact_lock(23399,120);
  select * into previous from public.admin_operations where request_id=p_request_id;
  if found then
    if previous.actor<>auth.uid() or previous.action<>'delete_all' then raise exception 'REQUEST_ID_CONFLICT'; end if;
    return previous.result_count;
  end if;
  -- DELETE emits Realtime events so display clients remove letters; TRUNCATE would not.
  delete from public.wishes where id is not null;
  get diagnostics deleted_count=row_count;
  update public.emergency_cursor set next_index=0 where singleton=true;
  insert into public.admin_operations(request_id,actor,action,result_count)
  values(p_request_id,auth.uid(),'delete_all',deleted_count);
  return deleted_count;
end;
$$;
revoke all on function public.admin_emergency_wishes(uuid) from public,anon,authenticated;
revoke all on function public.admin_delete_all_wishes(uuid,text) from public,anon,authenticated;
grant execute on function public.admin_emergency_wishes(uuid) to authenticated;
grant execute on function public.admin_delete_all_wishes(uuid,text) to authenticated;
commit;
