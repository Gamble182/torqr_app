# Präsentations-Checkliste für Max
## Termin: 14. Januar 2026 (Morgen)

---

## ✅ Technische Vorbereitung (Heute Abend)

### 1. Deployment überprüfen
- [ ] Production-URL öffnen: https://torqr-app.vercel.app
- [ ] Build-Status auf Vercel prüfen (sollte ✅ sein)
- [ ] Alle Seiten durchklicken (Dashboard, Kunden, Heizsysteme, Wartungen)
- [ ] Auf mobilen Gerät testen (Smartphone)
- [ ] Browser-Konsole überprüfen (keine Fehler)

### 2. Demo-Daten vorbereiten
- [ ] **3-5 Beispiel-Kunden** anlegen mit echten Namen (z.B. Max Mustermann, Anna Schmidt)
- [ ] **Pro Kunde 1-2 Heizsysteme** anlegen mit realistischen Daten:
  - Verschiedene Hersteller (Vaillant, Viessmann, Buderus)
  - Unterschiedliche Wartungstermine
  - Mindestens 1 überfälliges System (rot)
  - Mindestens 2 diese Woche fällige (orange)
  - Mindestens 2 demnächst fällige (grün)
- [ ] **5-10 Wartungen** in der Historie mit:
  - Notizen (z.B. "Filter gewechselt, Druck geprüft")
  - 2-3 Wartungen mit Fotos
  - Unterschiedliche Daten (letzte 3 Monate)

### 3. Präsentations-Geräte
- [ ] **Laptop/Desktop** vorbereiten:
  - Browser-Tabs schließen (nur Demo-Tab offen)
  - Benachrichtigungen deaktivieren
  - Vollbild-Modus vorbereiten (F11)
  - Bildschirm-Auflösung prüfen (für Projektor)
- [ ] **Smartphone** laden (mind. 80% Akku):
  - Torqr-URL als Lesezeichen speichern
  - Nicht-stören-Modus aktivieren
  - Mobile Daten aktivieren (falls kein WLAN)
  - Login im Voraus testen

### 4. Dokumente ausdrucken (optional)
- [ ] `docs/PROJEKT_DOKUMENTATION_MAX.md` als PDF exportieren
- [ ] 2-3 Seiten Feature-Übersicht ausdrucken
- [ ] Screenshot vom Dashboard ausdrucken (als Backup)

---

## 🎤 Präsentations-Ablauf (45-60 Minuten)

### Teil 1: Einleitung (5 Min.)

**Begrüßung & Kontext:**
```
"Hallo Max! Danke für deine Zeit heute.

Ich zeige dir heute die fertige Version deiner Wartungsmanagement-App 'Torqr'.
Wir haben in den letzten 8 Wochen eine vollständig funktionale Web-App entwickelt,
die dir hilft, deine Kunden, Heizsysteme und Wartungen digital zu verwalten.

Die App ist bereits live und kann sofort produktiv eingesetzt werden.

Ich zeige dir zuerst die Funktionen am Desktop, dann auf dem Handy,
weil du sie ja hauptsächlich vor Ort beim Kunden nutzen wirst."
```

**Agenda durchgehen:**
1. Dashboard-Übersicht (5 Min.)
2. Kundenverwaltung (10 Min.)
3. Heizsystem-Verwaltung (10 Min.)
4. Wartungs-Workflow (10 Min.)
5. Mobile-Demo (10 Min.)
6. Technische Details (5 Min.)
7. Nächste Schritte & Fragen (5-10 Min.)

---

### Teil 2: Dashboard (5 Min.)

**URL öffnen:** https://torqr-app.vercel.app
**Login** mit Demo-Account

**Zeigen:**
- [ ] Obere Navigationsleiste mit Datum & Uhrzeit
- [ ] 4 Kennzahlen-Karten (Kunden, Heizsysteme, Überfällig, Anstehend)
- [ ] Anstehende Wartungen mit Farbcodierung
  - Erkläre: Rot = überfällig, Orange = diese Woche, Grün = später
- [ ] **NEU: "Erledigt"-Button** direkt bei jeder Wartung
  - Klicke auf einen → Zeige Modal
  - Erkläre: "Du kannst jetzt direkt vom Dashboard eine Wartung als erledigt markieren"
- [ ] Click-to-Call bei Telefonnummern
- [ ] Letzte Wartungen unten

**Wichtige Punkte:**
```
"Hier siehst du auf einen Blick:
- Wie viele Wartungen diese Woche anstehen
- Welche überfällig sind (rot hervorgehoben)
- Du kannst direkt anrufen (Telefonnummer klicken)
- NEU: Mit einem Klick auf 'Erledigt' kannst du die Wartung dokumentieren"
```

---

### Teil 3: Kundenverwaltung (10 Min.)

**Navigiere zu "Kunden"**

**Zeigen:**
- [ ] Suchfunktion (tippe einen Namen ein)
- [ ] Kompakte Kartendarstellung
- [ ] Anzahl Heizsysteme pro Kunde
- [ ] Nächster Wartungstermin
- [ ] Status-Badges

**Kundendetails öffnen:**
- [ ] Kontaktinformationen (Click-to-Call, Click-to-Mail)
- [ ] **NEU: Moderne UI** mit Icons und Hover-Effekten
- [ ] **NEU: Energiesystem-Übersicht**:
  - Hauptheizsystem mit Icon (z.B. Flamme für Gas)
  - Zusätzliche Energiequellen (z.B. Photovoltaik-Badge)
  - Energiespeichersysteme (z.B. Batteriespeicher-Badge)
- [ ] **NEU: Schnellstatistiken**:
  - Heizsysteme: X
  - Wartungen OK: X
  - Bald fällig: X
  - Überfällig: X
- [ ] Heizsysteme-Liste mit Status-Badges
- [ ] "Wartung erledigt"-Button direkt beim Heizsystem

**Neuen Kunden anlegen:**
- [ ] Klicke "Neuer Kunde"
- [ ] Zeige Formular mit allen Feldern
- [ ] Erkläre Energiesystem-Konfiguration:
  - 11 Hauptheizsystem-Typen
  - 3 zusätzliche Energiequellen
  - 3 Energiespeicher-Typen
- [ ] Speichern (Demo)

**Wichtige Punkte:**
```
"Jeder Kunde hat jetzt eine detaillierte Energiesystem-Übersicht.
Du kannst genau dokumentieren:
- Welches Heizsystem (Gas, Wärmepumpe, etc.)
- Ob zusätzliche Energiequellen vorhanden sind (PV, Solar)
- Ob Speichersysteme installiert sind (Batterie, Wärmespeicher)

Die neue UI ist modern und übersichtlich mit Icons und Farbcodierung."
```

---

### Teil 4: Heizsystem-Verwaltung (10 Min.)

**Navigiere zu "Heizsysteme"**

**Zeigen:**
- [ ] Alle Heizsysteme in einer Liste
- [ ] Suchfunktion (nach Modell, Kunde, Seriennummer)
- [ ] Filter nach Wartungsstatus:
  - Alle / Überfällig / Diese Woche / Nächste 30 Tage
- [ ] Status-Badges mit Farben
- [ ] Kundenname klickbar

**Heizsystem-Details öffnen:**
- [ ] Umfassende Konfiguration:
  - Kategorie, Hersteller, Modell (kaskadierend)
  - Seriennummer, Installationsdatum, Baujahr, Leistung
  - Wärmespeicher-Konfiguration (Typ, Kapazität, Hersteller)
  - Batteriespeicher-Konfiguration (Technologie, Kapazität)
- [ ] Wartungsinformationen:
  - Wartungsintervall (z.B. 12 Monate)
  - Letzte Wartung
  - Nächste Wartung (automatisch berechnet)

**Neues Heizsystem anlegen:**
- [ ] Klicke "Neues Heizsystem"
- [ ] Zeige kaskadierende Dropdowns:
  - Wähle Kategorie (z.B. "Gasheizung")
  - Wähle Hersteller (z.B. "Vaillant")
  - Wähle Modell (z.B. "ecoTEC plus VCW")
- [ ] Zeige "Neuen Eintrag hinzufügen"-Funktion (falls Max eigene Modelle hat)
- [ ] Fülle technische Details aus
- [ ] Optional: Wärmespeicher hinzufügen
- [ ] Optional: Batteriespeicher hinzufügen
- [ ] Speichern

**Wichtige Punkte:**
```
"Hier hast du die komplette Kontrolle über alle Heizsysteme:
- Über 50 Hersteller vorkonfiguriert
- Über 100 Modellvarianten
- Du kannst eigene Modelle hinzufügen
- Wärmespeicher und Batteriespeicher komplett konfigurierbar
- Automatische Berechnung der Wartungstermine"
```

---

### Teil 5: Wartungs-Workflow (10 Min.)

**Szenario durchspielen:**
```
"Stell dir vor, du bist gerade beim Kunden und hast eine Wartung durchgeführt.
Ich zeige dir jetzt, wie schnell du das dokumentieren kannst."
```

**Workflow:**
1. [ ] Gehe zurück zum **Dashboard**
2. [ ] Finde die Wartung in "Anstehende Wartungen"
3. [ ] Klicke auf grünen **"Erledigt"-Button** (NEU!)
4. [ ] Modal öffnet sich:
   - Datum ist vorausgewählt (heute)
   - Füge Notizen hinzu (z.B. "Filter gewechselt, Druck geprüft, Brenner gereinigt")
   - **Fotos hochladen**:
     - Klicke "Fotos hinzufügen"
     - Wähle 2-3 Beispielfotos
     - Zeige Vorschau
   - Klicke "Wartung speichern"
5. [ ] ✅ Dashboard aktualisiert sich automatisch
   - Wartung verschwindet aus "Anstehende Wartungen"
   - Erscheint in "Letzte Wartungen"
   - Status ändert sich von "Überfällig" → "OK"
   - Nächste Wartung wird automatisch berechnet

**Wartungshistorie zeigen:**
- [ ] Gehe zu Kundendetails
- [ ] Zeige Heizsystem mit Wartungshistorie
- [ ] Zeige Fotos in Galerie
- [ ] Erkläre: Alle Wartungen dokumentiert mit Datum, Notizen, Fotos

**Wichtige Punkte:**
```
"Das ist das Herzstück der App:
- Wartung in unter 2 Minuten dokumentiert
- Fotos direkt vom Handy hochladen
- Nächster Termin wird automatisch berechnet
- Alles ist später nachvollziehbar

Du sparst dir:
- Händisches Notieren auf Papier
- Fotos aus Handy-Galerie suchen
- Wartungstermine manuell berechnen
- Excel-Listen pflegen"
```

---

### Teil 6: Mobile-Demo (10 Min.)

**Wechsel zum Smartphone**

**Zeigen:**
- [ ] Öffne App auf Smartphone
- [ ] Dashboard ist touch-optimiert
- [ ] Navigation funktioniert einwandfrei
- [ ] **Click-to-Call** demonstrieren:
  - Klicke auf Telefonnummer
  - Telefon-App öffnet sich mit Nummer
  - (Nicht wirklich anrufen)
- [ ] Wartung erfassen Workflow:
  - Dashboard → "Erledigt" klicken
  - Notizen per Smartphone-Tastatur
  - **Kamera-Integration**:
    - Klicke "Fotos hinzufügen"
    - Kamera öffnet sich
    - Mache 1-2 Beispielfotos
    - Vorschau zeigen
  - Speichern
- [ ] Zeige, dass alles sofort synchronisiert wird
  - Gehe zurück zum Desktop
  - Refresh → Wartung ist da!

**Wichtige Punkte:**
```
"Die App ist zu 100% mobile-optimiert:
- Touch-freundliche Buttons (min. 44px)
- Responsive auf jedem Gerät
- Click-to-Call für schnelles Anrufen
- Kamera direkt integriert
- Alles wird sofort synchronisiert

Du kannst die App also komplett vom Handy aus nutzen,
während du beim Kunden bist. Kein Laptop nötig!"
```

---

### Teil 7: Technische Details (5 Min.)

**Nur wenn Max interessiert ist, sonst überspringen**

**Zeigen (optional):**
- [ ] Öffne `docs/PROJEKT_DOKUMENTATION_MAX.md` als PDF
- [ ] Zeige Inhaltsverzeichnis
- [ ] Erkläre kurz:
  - Technologie-Stack (Next.js, React, TypeScript)
  - Hosting (Vercel - automatische Deployments)
  - Datenbank (Supabase - automatische Backups)
  - Sicherheit (HTTPS, verschlüsselt, DSGVO-konform)
- [ ] Zeige Feature-Liste
- [ ] Zeige Roadmap (zukünftige Features)

**Wichtige Punkte:**
```
"Die App ist professionell entwickelt:
- Moderne Technologien (wie Netflix, Spotify nutzen)
- Automatische Backups täglich
- DSGVO-konform (alle Daten verschlüsselt)
- Skalierbar (kann mit deinem Geschäft wachsen)
- Wartbar (Updates sind einfach)"
```

---

### Teil 8: Nächste Schritte & Fragen (5-10 Min.)

**Zusammenfassung:**
```
"Zusammengefasst hast du jetzt:
✅ Eine vollständig funktionale Wartungsmanagement-App
✅ Mobile-optimiert für Einsatz vor Ort
✅ Automatische Wartungstermin-Berechnung
✅ Foto-Upload für Dokumentation
✅ Quick-Action: Wartung direkt vom Dashboard erfassen
✅ Moderne, übersichtliche UI
✅ Live und produktionsbereit

Die App spart dir:
- ~2 Minuten pro Wartungsdokumentation
- ~15 Minuten pro Woche bei Terminplanung
- ~10 Minuten pro Woche bei Überfälligen-Verwaltung
= ~30 Minuten pro Woche = 2 Stunden pro Monat = 24 Stunden pro Jahr!
```

**Feedback einholen:**
- [ ] "Was gefällt dir besonders gut?"
- [ ] "Gibt es etwas, das anders sein sollte?"
- [ ] "Welche Features fehlen dir am meisten?"
- [ ] "Ist die App intuitiv genug?"
- [ ] "Würdest du sie so produktiv einsetzen?"

**Nächste Schritte besprechen:**
1. **Produktiv-Einsatz starten:**
   - Max legt erste echte Kunden an
   - Erste echte Wartungen dokumentieren
   - Feedback nach 1 Woche

2. **Feature-Priorisierung:**
   - Welche Erweiterungen sind wichtig?
   - Email-Automatisierung? (Wartungserinnerungen)
   - Kalender-Integration? (Terminplanung)
   - Reporting? (Monatsberichte, Statistiken)
   - Team-Features? (Mehrere Benutzer)

3. **Schulung & Support:**
   - Weitere Schulung nötig?
   - Fragen per E-Mail/Chat
   - Bugfixes & Updates laufend

**Roadmap zeigen:**
```
"Für 2026 habe ich eine Roadmap vorbereitet:

Q1 (Jan-März):
- Email-Automatisierung (Wartungserinnerungen)
- PDF-Export (Wartungsberichte)

Q2 (Apr-Jun):
- Kalender-Integration (Google Calendar Sync)
- Erweiterte Statistiken & Reports

Q3 (Jul-Sep):
- Team-Features (Mehrere Benutzer)
- Rollen & Permissions

Q4 (Okt-Dez):
- Offline-Modus (auch ohne Internet nutzbar)
- PWA Installierbar (wie native App)

Was davon ist dir am wichtigsten?"
```

---

## 📋 Checkliste für Morgen Früh

### 30 Minuten vor Präsentation:
- [ ] Laptop/Desktop einschalten
- [ ] Browser öffnen mit Torqr-Tab
- [ ] Login testen
- [ ] Demo-Daten überprüfen (alle da?)
- [ ] Smartphone laden & Login testen
- [ ] PDF-Dokumentation bereit
- [ ] Notizen durchlesen
- [ ] Tief durchatmen 😊

### 5 Minuten vor Präsentation:
- [ ] Benachrichtigungen aus (Laptop + Smartphone)
- [ ] Andere Browser-Tabs schließen
- [ ] Dashboard als Start-Seite öffnen
- [ ] Wasser bereitstellen
- [ ] Positive Einstellung! 🚀

---

## 🎯 Dos & Don'ts

### ✅ Dos

- **Begeisterung zeigen**: Du hast 8 Wochen harte Arbeit investiert!
- **Langsam sprechen**: Gib Max Zeit, alles zu verstehen
- **Pausen einlegen**: Frage zwischendurch "Hast du Fragen?"
- **Praxisnah sein**: Nutze echte Szenarien aus Max' Alltag
- **Feedback einholen**: Max' Meinung ist wichtig
- **Positiv bleiben**: Auch bei Kritik ruhig bleiben

### ❌ Don'ts

- **Nicht zu technisch werden**: Vermeide Fachbegriffe (API, Database, etc.)
- **Nicht hetzen**: Lieber 10 Minuten länger, dafür alles verstanden
- **Nicht perfektionistisch sein**: Kleine Bugs sind OK (notieren & später fixen)
- **Nicht defensiv werden**: Kritik ist wertvoll für Verbesserungen
- **Nicht überfordern**: Nicht ALLE Features zeigen, nur die wichtigsten
- **Nicht versprechen**: Keine unrealistischen Zusagen für neue Features

---

## 🚨 Notfall-Plan

### Wenn Internet ausfällt:
- Screenshots vorbereitet haben
- Präsentation als PDF zeigen
- Theorie statt Live-Demo

### Wenn Login nicht funktioniert:
- Demo-Account Zugangsdaten aufschreiben
- Alternative Demo-Umgebung vorbereiten
- Im Notfall: Localhost starten (npm run dev)

### Wenn Bug auftritt:
- Ruhig bleiben: "Das ist ein bekannter kleiner Bug, den fixe ich heute noch"
- Notieren und weitermachen
- Nicht an Bug hängenbleiben

### Wenn Max verwirrt ist:
- Pause einlegen
- Nochmal langsam erklären
- Praxisbeispiel nutzen
- Fragen: "Was genau ist unklar?"

---

## 💡 Geheimtipps

### 1. Story erzählen
Nutze konkrete Szenarien:
```
"Stell dir vor, es ist Montagmorgen.
Du trinkst deinen Kaffee und öffnst die App.
Du siehst sofort: 3 Wartungen sind überfällig (rot).
Du rufst die Kunden an, vereinbarst Termine.
Am Nachmittag bist du beim ersten Kunden.
Wartung fertig? Handy raus, Foto, Notiz, fertig.
Abends siehst du: Alle 3 Wartungen erledigt (grün).
Nächste Termine stehen automatisch drin."
```

### 2. Zeitersparnis betonen
Rechne konkret vor:
```
Vorher:
- Papier notieren: 3 Min
- Zuhause in Excel eintragen: 5 Min
- Nächsten Termin berechnen: 2 Min
- Foto vom Handy übertragen: 3 Min
= 13 Minuten pro Wartung

Jetzt:
- App öffnen, Foto, Notiz, speichern: 2 Min
= 11 Minuten gespart pro Wartung

Bei 100 Wartungen/Jahr = 1.100 Minuten = 18 Stunden gespart!
```

### 3. Mobile-First betonen
```
"Die meisten Wartungsmanagement-Tools sind Desktop-Apps.
Aber du bist ja selten am Schreibtisch.
Deshalb ist Torqr von Grund auf für's Handy gemacht.
Du kannst alles vom Handy aus machen, ohne Laptop."
```

### 4. Persönliche Note
```
"Ich habe in den letzten 8 Wochen eng mit dir zusammengearbeitet.
Jedes Feature ist genau auf deine Bedürfnisse zugeschnitten.
Die App ist nicht 'von der Stange', sondern maßgeschneidert für dich."
```

### 5. Zukunftsvision
```
"Das hier ist erst der Anfang.
Stell dir vor, in 6 Monaten:
- Die App erinnert Kunden automatisch per E-Mail
- Du hast einen Kalender mit allen Terminen
- Du siehst Monatsberichte: Umsatz, erledigte Wartungen
- Du hast ein Team und kannst Wartungen zuweisen
- Die App läuft auch offline

Alles ist möglich und erweiterbar!"
```

---

## 📊 Erfolgskriterien

Die Präsentation war erfolgreich, wenn:
- ✅ Max versteht, wie die App funktioniert
- ✅ Max sieht den Mehrwert (Zeitersparnis, Organisation)
- ✅ Max möchte die App produktiv einsetzen
- ✅ Max gibt konstruktives Feedback
- ✅ Max ist begeistert von der Quick-Action-Funktion
- ✅ Max hat Ideen für weitere Features
- ✅ Ihr besprecht nächste Schritte (Roadmap 2026)

---

## 🎉 Nach der Präsentation

### Sofort:
- [ ] Notizen machen (Was hat Max gesagt? Feedback?)
- [ ] Bugs notieren (falls aufgetreten)
- [ ] Feature-Wünsche aufschreiben
- [ ] Max danken für sein Feedback

### Heute Abend:
- [ ] Bugs fixen (falls kritisch)
- [ ] Dokumentation aktualisieren (falls nötig)
- [ ] Roadmap anpassen basierend auf Max' Prioritäten

### Diese Woche:
- [ ] Follow-up E-Mail an Max:
  - Zusammenfassung der Präsentation
  - Nächste Schritte
  - Timeline für priorisierte Features
  - Angebot für weitere Schulung

---

**Viel Erfolg morgen! Du schaffst das! 🚀**

*Du hast 8 Wochen harte Arbeit in diese App gesteckt.*
*Du kennst jedes Feature in- und auswendig.*
*Du kannst stolz darauf sein!*

**Zeig Max, was du gebaut hast! Er wird begeistert sein! 🎊**

---

*Checkliste erstellt am: 13. Januar 2026*
*Für: Präsentation bei Max am 14. Januar 2026*
