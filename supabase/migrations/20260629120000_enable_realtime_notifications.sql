-- Enable Realtime on notifications table for live updates
alter publication supabase_realtime add table notifications;

-- Enable Realtime on support_ticket_messages for live ticket threads
alter publication supabase_realtime add table support_ticket_messages;
