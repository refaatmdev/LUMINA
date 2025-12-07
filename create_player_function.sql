-- Function to allow unauthenticated players to fetch their assigned slide content
CREATE OR REPLACE FUNCTION get_player_slide_content(screen_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_active_slide_id UUID;
    v_group_id UUID;
    v_slide_content JSONB;
BEGIN
    -- 1. Get screen details (active_slide_id and group_id)
    SELECT active_slide_id, group_id INTO v_active_slide_id, v_group_id
    FROM screens
    WHERE id = screen_id;

    -- 2. If no direct slide, check group
    IF v_active_slide_id IS NULL AND v_group_id IS NOT NULL THEN
        SELECT active_slide_id INTO v_active_slide_id
        FROM screen_groups
        WHERE id = v_group_id;
    END IF;

    -- 3. If we have a slide ID, fetch content
    IF v_active_slide_id IS NOT NULL THEN
        SELECT content INTO v_slide_content
        FROM slides
        WHERE id = v_active_slide_id;
        
        RETURN jsonb_build_object(
            'slide_id', v_active_slide_id,
            'content', v_slide_content
        );
    END IF;

    RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION get_player_slide_content(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_player_slide_content(UUID) TO authenticated;
