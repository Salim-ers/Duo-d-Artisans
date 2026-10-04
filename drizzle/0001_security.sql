-- Row Level Security : toutes les tables sont verrouillées.
-- L'application accède à la base côté serveur uniquement (rôle propriétaire, non soumis au RLS).
-- Si la base est un jour exposée via une API publique (Supabase, PostgREST…), les rôles publics ne peuvent rien lire ni écrire.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users','customers','categories','products','product_variants','product_options','stock_movements',
    'events','event_products','promotions','orders','order_items','pickup_slots','custom_orders',
    'notifications','messages','gallery','settings','files','counters','push_subscriptions','audit_logs'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      EXECUTE format('REVOKE ALL ON TABLE %I FROM anon', t);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
      EXECUTE format('REVOKE ALL ON TABLE %I FROM authenticated', t);
    END IF;
  END LOOP;
END $$;
