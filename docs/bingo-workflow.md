# RF GGD Bingo Workflow

## Ziel

Mods und Royal-Family-Mitglieder sollen Bingo-Ideen gemeinsam pflegen können, ohne direkt an der Live-Webdatei oder am technischen Export zu arbeiten.

## Schichten

1. **Workshop-Sheet**
   - Für Menschen lesbar.
   - Gemeinsames Arbeiten mit Mods.
   - Enthält Vorschläge, Kommentare, Status und Diskussion.

2. **Corvus Review**
   - Prüft neue Einträge.
   - Erkennt Dopplungen.
   - Markiert unklare Felder.
   - Trennt Vorschläge von Live-Feldern.

3. **Live Export**
   - Nur freigegebene Felder.
   - Technisch sauberes JSON.
   - Quelle für die Web-App.

4. **Corvus Web**
   - Lädt `data/bingo-fields.json`.
   - Rendert daraus die Bingo-Karten.

## Empfohlenes Workshop-Sheet

Spalten:

- `idea_id`
- `label`
- `description`
- `category`
- `submitted_by`
- `status`
- `review_note`
- `active_for_live`
- `last_reviewed_by`
- `last_reviewed_at`

Statuswerte:

- `Vorschlag`
- `In Prüfung`
- `Angenommen`
- `Abgelehnt`
- `Archiv`

## Arbeitsregel

Mods bearbeiten nur das Workshop-Sheet.

Corvus/Owner erstellt aus angenommenen und aktiven Feldern den Live-Export.

## Manueller Befehl

> Corvus, prüf das Bingo-Workshop-Sheet und aktualisiere den Live-Export.

Danach:

1. Workshop-Sheet lesen.
2. Änderungen prüfen.
3. Export aktualisieren.
4. `data/bingo-fields.json` im Repo aktualisieren.
5. GitHub Pages baut automatisch neu.

## Schutzlogik

- Keine direkte Bearbeitung von `index.html` durch Mods.
- Keine direkte Bearbeitung von `data/bingo-fields.json` durch Mods.
- Änderungen bleiben über Google-Sheets-Versionen und GitHub-Commits nachvollziehbar.
