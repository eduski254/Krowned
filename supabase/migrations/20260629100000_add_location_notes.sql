-- Add location_notes for additional directions/building info
alter table businesses
  add column if not exists location_notes text;
