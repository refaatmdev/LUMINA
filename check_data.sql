
-- Check current user's profile (I can't get the *current* auth user easily in SQL script without session, 
-- so I'll just list all profiles and slides to see the state of data)

SELECT * FROM profiles;

SELECT count(*) as total_slides FROM slides;
SELECT count(*) as slides_with_org FROM slides WHERE org_id IS NOT NULL;
SELECT count(*) as slides_without_org FROM slides WHERE org_id IS NULL;

SELECT * FROM slides WHERE org_id IS NULL LIMIT 5;
