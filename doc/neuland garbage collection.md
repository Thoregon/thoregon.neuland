# Neuland Garbage Collection

Full text search for fast garbage collection
```sql
-- FTS index on the object column
CREATE VIRTUAL TABLE neuland_fts USING fts5(
  object,
  content='neuland',
  content_rowid='rowid',
  tokenize = "unicode61 tokenchars '@:'"
);

-- Build the index from existing rows, populate the index once
INSERT INTO neuland_fts(neuland_fts) VALUES('rebuild');

-- Keep it in sync with triggers
CREATE TRIGGER neuland_ai AFTER INSERT ON neuland BEGIN
    INSERT INTO neuland_fts(rowid, object) VALUES (new.rowid, new.object);
END;

CREATE TRIGGER neuland_ad AFTER DELETE ON neuland BEGIN
    INSERT INTO neuland_fts(neuland_fts, rowid, object) VALUES ('delete', old.rowid, old.object);
END;

CREATE TRIGGER neuland_au AFTER UPDATE ON neuland BEGIN
    INSERT INTO neuland_fts(neuland_fts, rowid, object) VALUES ('delete', old.rowid, old.object);
    INSERT INTO neuland_fts(rowid, object) VALUES (new.rowid, new.object);
END;
```

Query unreferenced souls
```sql
SELECT n.soul
FROM neuland AS n
WHERE  n.soul <> '00000000000000000000000000000000' AND NOT EXISTS (
  SELECT 1
  FROM neuland_fts AS f
  WHERE f.rowid <> n.rowid
    -- exact-token match for @soul:<that soul>
    AND neuland_fts MATCH '"' || '@soul:' || n.soul || '"'
);
```

Run garbage collection. After removing unused refernced objects, there may be a bunch of 'new' unreferenced objects.  
Repeat it until count(*) is zero 
```sql
DELETE FROM neuland
WHERE soul in (
    SELECT n.soul
    FROM neuland AS n
    WHERE  n.soul <> '00000000000000000000000000000000' AND NOT EXISTS (
        SELECT 1
        FROM neuland_fts AS f
        WHERE f.rowid <> n.rowid
          -- exact-token match for @soul:<that soul>
          AND neuland_fts MATCH '"' || '@soul:' || n.soul || '"'
    )
);
```

after garbage collection run 

```sql
VACUUM;
```
