-- Sadakat puanı ekle (atomic)
create or replace function add_loyalty_points(uid uuid, pts integer)
returns void language plpgsql as $$
begin
  update users set loyalty_points = loyalty_points + pts where id = uid;
end;
$$;
