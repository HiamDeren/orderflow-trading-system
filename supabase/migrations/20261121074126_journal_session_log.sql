-- session_log · log phiên khung Composite × pRTH × OVN (T12, D51) gộp vào journal của ngày
-- Thay localStorage "cb-log" của artifact. Không tạo bảng session_logs riêng:
--   open_type, bias_correct đã có ở journal_entries; R lấy từ journal_trades.
-- Khoá comp_pos / prth_build / ovn_build trùng khoá P_OPTS / B_OPTS / O_OPTS trong plan-core.js.

alter table trading.journal_entries
  add column comp_pos    text,
  add column prth_build  text,
  add column ovn_build   text,
  add column pre_bias    text,
  add column open_dir    text,
  add column ib_width    text,
  add column hvn_edge    text,
  add column reach_next  text,
  add constraint journal_entries_comp_pos_check   check (comp_pos   is null or comp_pos   in ('in', 'edgeU', 'edgeD', 'lvn', 'out')),
  add constraint journal_entries_prth_build_check check (prth_build is null or prth_build in ('accU', 'accD', 'bal', 'rejU', 'rejD')),
  add constraint journal_entries_ovn_build_check  check (ovn_build  is null or ovn_build  in ('up', 'down', 'in', 'wide')),
  add constraint journal_entries_pre_bias_check   check (pre_bias   is null or pre_bias   in ('Lên', 'Xuống', 'Balance', 'Xung đột')),
  add constraint journal_entries_open_dir_check   check (open_dir   is null or open_dir   in ('Lên', 'Xuống')),
  add constraint journal_entries_ib_width_check   check (ib_width   is null or ib_width   in ('Hẹp', 'Bình thường', 'Rộng')),
  add constraint journal_entries_hvn_edge_check   check (hvn_edge   is null or hvn_edge   in ('Giữ (fade đúng)', 'Chấp nhận ra ngoài', 'Ra ngoài rồi quay lại', 'Không chạm mép')),
  add constraint journal_entries_reach_next_check check (reach_next is null or reach_next in ('Có', 'Không', 'Không áp dụng'));

comment on column trading.journal_entries.comp_pos   is 'Vị trí giá 9:29 so với composite (khoá P_OPTS): in / edgeU / edgeD / lvn / out';
comment on column trading.journal_entries.prth_build is 'pRTH build (khoá B_OPTS): accU / accD / bal / rejU / rejD';
comment on column trading.journal_entries.ovn_build  is 'OVN so với VA pRTH (khoá O_OPTS): up / down / in / wide';
comment on column trading.journal_entries.pre_bias   is 'Bias trước phiên: Lên / Xuống / Balance / Xung đột';
comment on column trading.journal_entries.open_dir   is 'Hướng của open type (OD / OTD / ORR); Open auction để trống';
comment on column trading.journal_entries.ib_width   is 'Độ rộng IB: Hẹp / Bình thường / Rộng';
comment on column trading.journal_entries.hvn_edge   is 'Phản ứng ở mép HVN trong phiên';
comment on column trading.journal_entries.reach_next is 'Ra khỏi mép thì có tới HVN kế tiếp không';

alter table trading.journal_trades
  add column setup text,
  add constraint journal_trades_setup_check check (setup is null or setup in ('F', 'C', 'V'));
comment on column trading.journal_trades.setup is 'Setup của khung: F = Fade mép HVN, C = Continuation tới HVN kế, V = VWAP';

-- save_journal: thêm các cột log phiên + setup của lệnh (giữ nguyên chữ ký hàm)
create or replace function trading.save_journal(p jsonb)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  v_entry uuid;
  v_trade uuid;
  v_tag   uuid;
  t       jsonb;
  m       text;
  i       int := 0;
begin
  insert into trading.journal_entries as e (
    trade_date, symbol, day_type, result, open_type, bias_correct,
    comp_pos, prth_build, ovn_build, pre_bias, open_dir, ib_width, hvn_edge, reach_next,
    context, session_story, plan_vs_actual, trade_review, orderflow, process_score, psychology, next_levels, lesson
  ) values (
    (p->>'trade_date')::date, coalesce(nullif(p->>'symbol', ''), 'NQ'),
    nullif(p->>'day_type', ''), nullif(p->>'result', ''), nullif(p->>'open_type', ''), nullif(p->>'bias_correct', ''),
    nullif(p->>'comp_pos', ''), nullif(p->>'prth_build', ''), nullif(p->>'ovn_build', ''), nullif(p->>'pre_bias', ''),
    nullif(p->>'open_dir', ''), nullif(p->>'ib_width', ''), nullif(p->>'hvn_edge', ''), nullif(p->>'reach_next', ''),
    nullif(p->>'context', ''), nullif(p->>'session_story', ''), nullif(p->>'plan_vs_actual', ''), nullif(p->>'trade_review', ''),
    nullif(p->>'orderflow', ''), nullif(p->>'process_score', ''), nullif(p->>'psychology', ''), nullif(p->>'next_levels', ''),
    nullif(p->>'lesson', '')
  )
  on conflict (trade_date, symbol) do update set
    day_type = excluded.day_type, result = excluded.result, open_type = excluded.open_type, bias_correct = excluded.bias_correct,
    comp_pos = excluded.comp_pos, prth_build = excluded.prth_build, ovn_build = excluded.ovn_build, pre_bias = excluded.pre_bias,
    open_dir = excluded.open_dir, ib_width = excluded.ib_width, hvn_edge = excluded.hvn_edge, reach_next = excluded.reach_next,
    context = excluded.context, session_story = excluded.session_story, plan_vs_actual = excluded.plan_vs_actual,
    trade_review = excluded.trade_review, orderflow = excluded.orderflow, process_score = excluded.process_score,
    psychology = excluded.psychology, next_levels = excluded.next_levels, lesson = excluded.lesson
  returning e.id into v_entry;

  delete from trading.journal_trades where entry_id = v_entry;

  for t in select * from jsonb_array_elements(coalesce(p->'trades', '[]'::jsonb)) loop
    i := i + 1;
    insert into trading.journal_trades (entry_id, seq, entry_time, side, qty, setup, level, trigger, r, pnl, fee, followed_plan)
    values (
      v_entry, i, nullif(t->>'entry_time', '')::time, t->>'side', coalesce(nullif(t->>'qty', '')::smallint, 1),
      nullif(t->>'setup', ''), nullif(t->>'level', ''), nullif(t->>'trigger', ''), nullif(t->>'r', '')::numeric,
      nullif(t->>'pnl', '')::numeric, coalesce(nullif(t->>'fee', '')::numeric, 0), nullif(t->>'followed_plan', '')
    )
    returning id into v_trade;
    for m in select distinct btrim(x) from jsonb_array_elements_text(coalesce(t->'mistakes', '[]'::jsonb)) as x where btrim(x) <> '' loop
      insert into trading.tags (kind, name) values ('mistake', m)
      on conflict (kind, name) do update set name = excluded.name
      returning id into v_tag;
      insert into trading.trade_tags (trade_id, tag_id) values (v_trade, v_tag) on conflict do nothing;
    end loop;
  end loop;
  return v_entry;
end $$;
revoke execute on function trading.save_journal(jsonb) from public, anon, authenticated;
grant execute on function trading.save_journal(jsonb) to service_role;
