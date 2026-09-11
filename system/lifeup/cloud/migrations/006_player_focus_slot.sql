-- Quest v2 player focus invariant.
-- All Quest v2 quests are real/player quests and occupy the single focus slot.
-- Legacy Quest v1 infrastructure probes remain historical and do not consume it.

CREATE OR REPLACE FUNCTION system_validate_player_focus_slot_v2()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_quest_id text;
BEGIN
  IF NEW.event_type = 'quest.created' AND COALESCE(NEW.payload->>'quest_version','') = '2' THEN
    v_quest_id := btrim(COALESCE(NEW.payload->>'quest_id',''));
    PERFORM pg_advisory_xact_lock(hashtextextended('quest-v2:player-slot', 0));

    IF EXISTS (
      SELECT 1
      FROM system_events c
      WHERE c.event_type = 'quest.created'
        AND COALESCE(c.payload->>'quest_version','') = '2'
        AND NOT EXISTS (
          SELECT 1
          FROM system_events t
          WHERE t.event_type IN ('quest.completed','quest.cancelled','quest.failed','quest.expired')
            AND t.payload->>'quest_id' = c.payload->>'quest_id'
        )
    ) THEN
      RAISE EXCEPTION 'another active player quest already exists';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.event_type IN ('quest.completed','quest.cancelled','quest.failed','quest.expired') THEN
    PERFORM pg_advisory_xact_lock(hashtextextended('quest-v2:player-slot', 0));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS zzz_system_events_player_focus_v2 ON system_events;
CREATE TRIGGER zzz_system_events_player_focus_v2
  BEFORE INSERT ON system_events
  FOR EACH ROW
  WHEN (
    (NEW.event_type = 'quest.created' AND COALESCE(NEW.payload->>'quest_version','') = '2')
    OR NEW.event_type IN ('quest.completed','quest.cancelled','quest.failed','quest.expired')
  )
  EXECUTE FUNCTION system_validate_player_focus_slot_v2();
