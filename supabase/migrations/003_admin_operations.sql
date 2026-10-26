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
(1,'Con yêu','Ba tin con luôn vững vàng trên con đường đại học đã chọn.'),
(2,'Con yêu','Mẹ chúc con học tốt và có nhiều niềm vui tại EIU.'),
(3,'Con yêu','Ba luôn tự hào và đồng hành cùng ước mơ của con.'),
(4,'Con yêu','Mẹ mong con luôn khỏe mạnh, tự tin và ăn ngủ đúng giờ.'),
(5,'Con yêu','Ba chúc con có những năm tháng sinh viên thật rực rỡ.'),
(6,'Con yêu','Mẹ luôn là điểm tựa bình yên và ấm áp nhất của con.'),
(7,'Con yêu','Ba tin con sẽ làm chủ tri thức và tương lai của mình.'),
(8,'Con yêu','Mẹ tự hào khi thấy con trưởng thành và biết lo toan.'),
(9,'Con yêu','Ba mong con luôn kiên trì, bản lĩnh trước mọi thử thách.'),
(10,'Con yêu','Mẹ chúc con tìm được niềm say mê trong từng môn học.'),
(11,'Con yêu','Ba chúc con luôn giữ vững đam mê với ngành học của mình.'),
(12,'Con yêu','Mẹ thương chúc con yêu luôn rạng rỡ và bình an.'),
(13,'Con yêu','Ba luôn ở phía sau tiếp thêm sức mạnh cho con.'),
(14,'Con yêu','Mẹ mong con nhớ giữ gìn sức khỏe, đừng thức quá khuya nhé.'),
(15,'Con yêu','Ba tin con sẽ tìm thấy con đường và lý tưởng của riêng mình.'),
(16,'Con yêu','Mẹ luôn tin con sẽ làm thật tốt mọi việc con yêu thích.'),
(17,'Con yêu','Ba chúc con học tập tốt và gặt hái nhiều trải nghiệm quý giá.'),
(18,'Con yêu','Mẹ chúc con có những tình bạn đẹp thời sinh viên.'),
(19,'Con yêu','Ba tự hào khi thấy con trưởng thành và tự lập mỗi ngày.'),
(20,'Con yêu','Mẹ tự hào về sự chăm chỉ và tấm lòng hiếu thảo của con.'),
(21,'Con yêu','Ba mong con dám nghĩ dám làm, không ngại bước ra biển lớn.'),
(22,'Con yêu','Mẹ mong mỗi ngày đến giảng đường đều mang lại niềm vui cho con.'),
(23,'Con yêu','Ba chúc con luôn tự tin, vững bước trong từng kỳ học.'),
(24,'Con yêu','Mẹ luôn mở rộng vòng tay đợi con về sau những ngày bận rộn.'),
(25,'Con yêu','Ba luôn tin tưởng vào sự lựa chọn và nỗ lực của con.'),
(26,'Con yêu','Mẹ chúc con thi cử suôn sẻ, làm bài thật tự tin.'),
(27,'Con yêu','Ba mong con rèn luyện cả tài năng lẫn đạo đức tại trường.'),
(28,'Con yêu','Mẹ mong con biết yêu thương bản thân và lắng nghe cơ thể.'),
(29,'Con yêu','Ba chúc con kết giao thêm nhiều người bạn cùng chí hướng.'),
(30,'Con yêu','Mẹ tin con sẽ tỏa sáng với năng lực và sự kiên trì của mình.'),
(31,'Con yêu','Ba thương chúc con đạt kết quả thật tốt trong mùa thi tới.'),
(32,'Con yêu','Mẹ chúc con học thêm nhiều điều hay từ thầy cô và bạn bè.'),
(33,'Con yêu','Ba mong con luôn giữ tinh thần ham học hỏi và sáng tạo.'),
(34,'Con yêu','Mẹ luôn cầu mong con được bình an và may mắn trên mọi nẻo đường.'),
(35,'Con yêu','Ba tin những đêm miệt mài ôn luyện sẽ đem lại quả ngọt.'),
(36,'Con yêu','Mẹ tự hào vì con luôn sống tình cảm và biết quan tâm mọi người.'),
(37,'Con yêu','Ba luôn là điểm tựa vững chãi mỗi khi con cần sẻ chia.'),
(38,'Con yêu','Mẹ chúc con luôn giữ được nét hồn nhiên và tinh thần lạc quan.'),
(39,'Con yêu','Ba mong con biết cân bằng giữa học tập và sức khỏe.'),
(40,'Con yêu','Mẹ mong con không đặt nặng áp lực, cứ cố gắng hết sức là được.'),
(41,'Con yêu','Ba chúc con có nhiều kỷ niệm đẹp dưới mái trường EIU.'),
(42,'Con yêu','Mẹ thương chúc con một kỳ học bổ ích và nhiều niềm vui.'),
(43,'Con yêu','Ba tự hào về sự kiên định và tinh thần trách nhiệm của con.'),
(44,'Con yêu','Mẹ luôn ở bên con, lắng nghe mọi vui buồn con kể.'),
(45,'Con yêu','Ba chúc con chinh phục thành công những mục tiêu đã đề ra.'),
(46,'Con yêu','Mẹ chúc con gặp nhiều thuận lợi trong công việc và học tập.'),
(47,'Con yêu','Ba mong con không sợ sai lầm, mỗi vấp ngã là một bài học.'),
(48,'Con yêu','Mẹ mong con luôn nhớ ăn cơm đầy đủ, đừng bỏ bữa nhé con.'),
(49,'Con yêu','Ba tin con sẽ trở thành một người tài giỏi và có ích.'),
(50,'Con yêu','Mẹ tự hào thấy con tự lập và vững vàng ở môi trường mới.'),
(51,'Con yêu','Ba chúc con hoàn thành xuất sắc đồ án và các môn học khó.'),
(52,'Con yêu','Mẹ chúc con luôn kiên nhẫn và bao dung với chính mình.'),
(53,'Con yêu','Ba mong con giữ vững nhiệt huyết tuổi trẻ và niềm tin.'),
(54,'Con yêu','Mẹ mong con tìm thấy hạnh phúc từ những điều giản dị quanh mình.'),
(55,'Con yêu','Ba luôn dõi theo từng bước tiến bộ của con trên giảng đường.'),
(56,'Con yêu','Mẹ tin con có đủ sức mạnh để vượt qua mọi khó khăn.'),
(57,'Con yêu','Ba chúc con luôn giữ cái đầu lạnh và trái tim ấm áp.'),
(58,'Con yêu','Mẹ chúc con bước vào kỳ thi mới với tâm thế nhẹ nhàng, tự tin.'),
(59,'Con yêu','Ba tin tương lai tươi sáng đang chờ đón nỗ lực của con.'),
(60,'Con yêu','Mẹ luôn thương yêu và gửi gắm trọn vẹn niềm tin nơi con.'),
(61,'Con yêu','Ba mong con học thật sâu, hiểu thật kỹ và ứng dụng tốt.'),
(62,'Con yêu','Mẹ mong con biết chia sẻ và giúp đỡ bạn bè cùng tiến bộ.'),
(63,'Con yêu','Ba chúc con luôn nhiều năng lượng tích cực mỗi ngày đến lớp.'),
(64,'Con yêu','Mẹ chúc con luôn giữ trái tim ấm áp và tinh thần kiên cường.'),
(65,'Con yêu','Ba tự hào vì con luôn biết phấn đấu và vươn lên.'),
(66,'Con yêu','Mẹ tự hào vì con đã nỗ lực không ngừng nghỉ suốt thời gian qua.'),
(67,'Con yêu','Ba chúc con mở rộng tầm nhìn và tự tin hội nhập.'),
(68,'Con yêu','Mẹ chúc con có những kỷ niệm thanh xuân tươi đẹp nhất ở EIU.'),
(69,'Con yêu','Ba mong con luôn biết tự chăm sóc bản thân khi xa nhà.'),
(70,'Con yêu','Mẹ mong con ngủ ngon sau một ngày học tập vất vả.'),
(71,'Con yêu','Ba tin bản lĩnh sinh viên EIU sẽ giúp con tỏa sáng.'),
(72,'Con yêu','Mẹ tin sự chân thành sẽ giúp con kết nối được nhiều bạn tốt.'),
(73,'Con yêu','Ba luôn sẵn sàng lắng nghe mọi dự định và trăn trở của con.'),
(74,'Con yêu','Mẹ chúc con luôn vững tin vào giá trị của chính mình.'),
(75,'Con yêu','Ba chúc con có thêm nhiều cơ hội thực tập và học hỏi.'),
(76,'Con yêu','Mẹ luôn sẵn sàng nấu những món con thích mỗi khi con về nhà.'),
(77,'Con yêu','Ba mong con giữ nếp sống kỷ luật và tinh thần tự học.'),
(78,'Con yêu','Mẹ mong con biết lắng nghe và học hỏi điều tốt từ mọi người.'),
(79,'Con yêu','Ba tin con sẽ là niềm tự hào lớn của cả gia đình.'),
(80,'Con yêu','Mẹ chúc con luôn yêu đời và tràn đầy năng lượng tích cực.'),
(81,'Con yêu','Ba chúc con vượt qua kỳ thi với kết quả cao nhất.'),
(82,'Con yêu','Mẹ tự hào vì thấy con biết vượt qua những lúc mệt mỏi.'),
(83,'Con yêu','Ba mong con nuôi dưỡng ước mơ lớn và từng bước thực hiện.'),
(84,'Con yêu','Mẹ chúc con gặt hái được nhiều học bổng và thành tích tốt.'),
(85,'Con yêu','Ba luôn tin con có đủ nghị lực để vượt qua áp lực.'),
(86,'Con yêu','Mẹ mong con giữ gìn nụ cười tươi tắn trên môi mỗi ngày.'),
(87,'Con yêu','Ba chúc con tìm được người thầy giỏi dẫn dắt tương lai.'),
(88,'Con yêu','Mẹ tin con sẽ trở thành một người có ích và thành đạt.'),
(89,'Con yêu','Ba mong con trân trọng từng cơ hội học tập tại giảng đường.'),
(90,'Con yêu','Mẹ chúc con hoàn thành tốt mọi bài tập nhóm và thuyết trình.'),
(91,'Con yêu','Ba tự hào vì con đã biết sống có mục tiêu rõ ràng.'),
(92,'Con yêu','Mẹ luôn là nơi con có thể quay về tìm sự thanh thản.'),
(93,'Con yêu','Ba chúc con luôn bình tĩnh, tự tin trong mọi buổi thuyết trình.'),
(94,'Con yêu','Mẹ mong con biết trân trọng công sức và tình cảm của mọi người.'),
(95,'Con yêu','Ba mong con giữ vững sự trung thực và lòng nhân ái.'),
(96,'Con yêu','Mẹ chúc con khám phá thêm nhiều điều mới lạ và bổ ích.'),
(97,'Con yêu','Ba luôn ủng hộ mọi quyết định chín chắn của con.'),
(98,'Con yêu','Mẹ tự hào khi thấy con biết tự đưa ra những quyết định đúng đắn.'),
(99,'Con yêu','Ba chúc con rèn luyện tư duy phản biện và kỹ năng tốt.'),
(100,'Con yêu','Mẹ chúc con có những ngày sinh viên tràn ngập tiếng cười.'),
(101,'Con yêu','Ba tin con sẽ tạo dựng được sự nghiệp vững vàng mai sau.'),
(102,'Con yêu','Mẹ mong con luôn giữ vững ước mơ và không ngừng cố gắng.'),
(103,'Con yêu','Ba mong con không ngừng hoàn thiện bản thân mỗi ngày.'),
(104,'Con yêu','Mẹ tin con sẽ tìm được hướng đi đúng đắn cho tương lai.'),
(105,'Con yêu','Ba chúc con luôn tràn đầy nhiệt huyết trong các phong trào.'),
(106,'Con yêu','Mẹ chúc con luôn được thầy yêu bạn mến dưới mái trường EIU.'),
(107,'Con yêu','Ba tự hào vì thấy con ngày càng chững chạc và sâu sắc.'),
(108,'Con yêu','Mẹ tự hào vì con yêu của mẹ luôn sống rất tử tế.'),
(109,'Con yêu','Ba chúc con có một tương lai rộng mở và hạnh phúc.'),
(110,'Con yêu','Mẹ mong con biết nghỉ ngơi hợp lý để tái tạo năng lượng.'),
(111,'Con yêu','Ba mong con luôn ghi nhớ bài học từ những người đi trước.'),
(112,'Con yêu','Mẹ chúc con vượt qua mùa thi với kết quả thật rực rỡ.'),
(113,'Con yêu','Ba tin con sẽ làm nên những điều tuyệt vời bằng nỗ lực của mình.'),
(114,'Con yêu','Mẹ luôn nhớ và thương con, cố gắng lên con yêu nhé.'),
(115,'Con yêu','Ba chúc con một học kỳ thuận lợi, nhiều điểm số xứng đáng.'),
(116,'Con yêu','Mẹ mong con luôn tìm thấy niềm hứng khởi mỗi khi mở trang sách.'),
(117,'Con yêu','Ba luôn ở đây, đồng hành và tin tưởng con hết lòng.'),
(118,'Con yêu','Mẹ tin rằng mọi nỗ lực của con hôm nay sẽ được đền đáp xứng đáng.'),
(119,'Con yêu','Ba chúc con luôn vững tâm, bền chí trên con đường đã chọn.'),
(120,'Con yêu','Mẹ chúc con luôn bình an, mạnh mẽ và hạnh phúc trên mọi bước đi.')
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
  batch_count:=10;
  select greatest(clock_timestamp(),coalesce(max(created_at)+interval '1 millisecond',clock_timestamp()))
    into batch_time from public.wishes;
  insert into public.wishes(id,name,recipient,message,color,status,source,created_at)
  select gen_random_uuid(),(array['Mẹ Lan','Ba Hùng','Mẹ Mai','Ba Tuấn','Mẹ Thảo','Ba Dũng','Mẹ Hoa','Ba Nam','Mẹ Hương','Ba Minh'])[((start_index+i)%10)::integer+1],s.recipient,s.message,
    (array['green','gold','pink','sage'])[((start_index+i)%4)::integer+1],'approved','emergency',batch_time+i*interval '1 millisecond'
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
