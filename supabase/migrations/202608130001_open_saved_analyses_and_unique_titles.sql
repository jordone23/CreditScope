-- CreditScope: otwieranie zapisanych analiz i unikalne aktywne tytuły per użytkownik.
-- Tytuł można ponownie wykorzystać po logicznym usunięciu analizy.

create unique index saved_analysis_active_user_title_key
on public.saved_analysis (user_id, lower(btrim(title)))
where deleted_at is null;
