-- Allow business owner/staff to UPDATE their own review responses (edit reply)
create policy "Responder updates own review response"
  on review_responses for update
  to authenticated
  using (responder_id = auth.uid())
  with check (responder_id = auth.uid());
