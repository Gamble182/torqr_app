# 🚀 Production Deployment Guide für Torqr App

## Problem
Die App ist deployed, aber Login/Registrierung funktioniert nicht (Error 500).

## Ursache
- Environment-Variablen sind nicht in Vercel gesetzt
- Datenbank-Migrationen wurden nicht ausgeführt
- `AUTH_URL` zeigt noch auf localhost statt auf die Production-URL

---

## ✅ Schritt-für-Schritt-Lösung

### Schritt 1: Environment-Variablen in Vercel setzen

1. **Gehe zu Vercel Dashboard:**
   - Öffne https://vercel.com
   - Wähle dein Projekt "torqr-app"

2. **Navigiere zu Settings:**
   - Klicke auf **Settings** (oben im Menü)
   - Klicke auf **Environment Variables** (linke Sidebar)

3. **Füge ALLE Variablen aus `production-deploy.env` hinzu:**

   Für jede Variable:
   - Klicke auf "Add New"
   - Trage Name und Value ein
   - **WICHTIG:** Wähle nur **Production** aus (nicht Preview, nicht Development)
   - Klicke "Save"

   **Liste der Variablen (alle aus production-deploy.env kopieren):**
   ```
   DATABASE_URL
   DIRECT_URL
   JWT_SECRET
   AUTH_SECRET
   AUTH_URL
   RESEND_API_KEY
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   CRON_SECRET
   NEXT_PUBLIC_SENTRY_DSN
   NEXT_PUBLIC_APP_URL
   NODE_ENV
   ```

4. **Besonders wichtig:**
   - `AUTH_URL=https://torqr-app.vercel.app`
   - `NEXT_PUBLIC_APP_URL=https://torqr-app.vercel.app`
   - `NODE_ENV=production`

---

### Schritt 2: Code-Änderungen committen und pushen

Die folgenden Dateien wurden geändert und müssen deployed werden:

1. **package.json** - Build-Skript aktualisiert für Datenbank-Migrationen
2. **vercel.json** - Neue Vercel-Konfiguration
3. **src/app/page.tsx** - Deutsche Übersetzungen

**Commit und Push:**
```bash
git add .
git commit -m "Fix production authentication and add database migrations

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
git push
```

---

### Schritt 3: Vercel Deployment auslösen

**Option A: Automatisch (wenn Git verbunden ist):**
- Der Push zu GitHub/GitLab triggert automatisch ein neues Deployment
- Warte bis das Deployment fertig ist (ca. 2-3 Minuten)

**Option B: Manuell über Vercel Dashboard:**
1. Gehe zu **Deployments** Tab
2. Klicke auf die drei Punkte beim letzten Deployment
3. Wähle **Redeploy**
4. Wähle **Use existing Build Cache** NICHT aus (wir brauchen einen kompletten Rebuild)
5. Klicke **Redeploy**

---

### Schritt 4: Deployment-Logs überprüfen

1. Gehe zu **Deployments** in Vercel
2. Klicke auf das neueste Deployment
3. Schau dir die **Build Logs** an
4. **Suche nach:**
   - ✅ `prisma migrate deploy` - sollte erfolgreich sein
   - ✅ `Migration engine ready` - bedeutet DB ist bereit
   - ✅ `Build completed` - Build war erfolgreich
   - ❌ Irgendwelche ERROR-Meldungen

**Wenn Fehler auftreten:**
- Screenshot der Fehlermeldung machen
- Mit mir teilen für weitere Hilfe

---

### Schritt 5: Funktionalität testen

1. **Öffne die App:**
   - Gehe zu https://torqr-app.vercel.app

2. **Teste Registrierung:**
   - Klicke auf "Konto erstellen"
   - Fülle das Formular aus:
     - Name: Test User
     - E-Mail: test2@torqr.app (neue E-Mail verwenden!)
     - Passwort: Test123! (muss Groß-, Kleinbuchstaben + Zahl haben)
     - Telefon: optional
   - Klicke "Konto erstellen"
   - **Erwartetes Ergebnis:** Weiterleitung zur Login-Seite mit Erfolgs-Meldung

3. **Teste Login:**
   - E-Mail: test2@torqr.app
   - Passwort: Test123!
   - Klicke "Anmelden"
   - **Erwartetes Ergebnis:** Weiterleitung zum Dashboard

4. **Prüfe Dashboard:**
   - Sollte Statistiken anzeigen (0 Kunden, 0 Heizungen, etc.)
   - Navigation sollte funktionieren

---

## 🔍 Troubleshooting

### Problem: "Error 500" beim Registrieren

**Mögliche Ursachen:**
1. **Environment-Variablen fehlen**
   - Lösung: Prüfe in Vercel → Settings → Environment Variables
   - Alle Variablen aus `production-deploy.env` müssen vorhanden sein
   - Achte darauf, dass bei jeder Variable "Production" ✓ ist

2. **Datenbank-Migration fehlgeschlagen**
   - Lösung: Schau in die Build-Logs (siehe Schritt 4)
   - Suche nach `prisma migrate deploy` Fehlern
   - Eventuell DATABASE_URL falsch?

3. **Datenbank-Verbindung schlägt fehl**
   - Lösung: Prüfe, ob Supabase-Datenbank läuft
   - Teste die DATABASE_URL in einem lokalen Terminal:
     ```bash
     psql "postgresql://postgres:yCJGTJ9NAxVuBwwz@db.vvsmxzebaoslofigxakt.supabase.co:5432/postgres"
     ```

### Problem: "Invalid email or password" beim Login (aber User existiert)

**Ursachen:**
1. **AUTH_SECRET fehlt oder ist falsch**
   - Lösung: Prüfe AUTH_SECRET in Vercel Environment Variables

2. **Session-Management Problem**
   - Lösung: Lösche Browser-Cache und Cookies für torqr-app.vercel.app
   - Versuche in einem Inkognito-Fenster

### Problem: Sentry-Fehler (ERR_BLOCKED_BY_CLIENT)

**Das ist OK!** Diese Fehler kommen von deinem Browser/AdBlocker, der Sentry blockiert.
- Das verhindert NICHT, dass die App funktioniert
- Kannst du ignorieren oder Sentry in der Whitelist eintragen

### Problem: "forgot-password" 404 Fehler

**Das ist auch OK!** Die Passwort-Vergessen-Seite existiert noch nicht.
- Wird in einem späteren Sprint implementiert
- Der Login funktioniert trotzdem

---

## 📋 Checkliste

Hake ab, wenn erledigt:

- [ ] Alle Environment-Variablen in Vercel gesetzt (Production)
- [ ] Code geändert, committed und gepusht
- [ ] Neues Deployment in Vercel gestartet
- [ ] Build-Logs überprüft (keine Fehler)
- [ ] Registrierung getestet (erfolgreich)
- [ ] Login getestet (erfolgreich)
- [ ] Dashboard öffnet sich

---

## 🆘 Wenn nichts funktioniert

1. **Screenshot der Console-Fehler machen** (F12 → Console Tab)
2. **Screenshot der Network-Fehler machen** (F12 → Network Tab, filtere nach "api")
3. **Screenshot der Vercel Build-Logs machen**
4. **Teile alle Screenshots mit mir**

Dann kann ich dir gezielt weiterhelfen!

---

## ✨ Nach erfolgreicher Deployment

Wenn alles funktioniert:

1. **Teste alle Funktionen:**
   - Kunde anlegen
   - Heizung hinzufügen
   - Wartung erfassen
   - Fotos hochladen

2. **Lösche Test-User wenn gewünscht:**
   - Direkt in der Supabase-Datenbank
   - Oder über die App selbst

3. **Produktiv-User anlegen:**
   - Erstelle deinen echten Admin-Account
   - Mit deiner echten E-Mail

---

**Viel Erfolg! 🚀**
