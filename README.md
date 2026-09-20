# Shiftly

Shiftly ist ein responsiver, deutschsprachiger Familien-Schichtkalender. Eine Administratorin verwaltet Früh-, Spät- und Nachtdienste per Drag-and-drop oder Tastatur-/Klickbedienung; angemeldete Familienmitglieder sehen Kalender und Details im Nur-Lese-Modus.

Die Anwendung startet ohne externe Dienste sofort im lokalen Demo-Modus. Für eine echte geräteübergreifende Nutzung steht ein Supabase-Adapter inklusive Datenbankschema und serverseitigen Row-Level-Security-Regeln bereit.

## Voraussetzungen

- Node.js 22 oder neuer
- npm 11 oder neuer
- optional: ein Supabase-Projekt

## Installation und Start

```bash
npm install
npm start
```

Danach ist die Anwendung unter `http://localhost:4200` erreichbar. Ein Produktions-Build wird mit `npm run build` erstellt und liegt unter `dist/apps/shift-calendar/browser`.

Das Repository ist ein Nx-Workspace. Starte die Anwendung deshalb immer aus dem Repository-Stamm mit `npm start` oder `npm exec -- nx serve shift-calendar`. `ng serve` erwartet einen klassischen Angular-CLI-Workspace mit `angular.json` und ist hier nicht der richtige Einstiegspunkt.

Falls der globale npm-Cache auf macOS root-eigene Dateien enthält, verwendet die eingecheckte `.npmrc` automatisch den ignorierten Projektcache `.npm-cache`. Dadurch benötigt `npm install` weder `sudo` noch `--force`.

## Demo-Zugangsdaten

| Rolle | Benutzername | Passwort |
| --- | --- | --- |
| Administratorin | `mama` | `mama123` |
| Nur-Lese-Zugriff | `familie` | `familie123` |

> Der lokale Demo-Modus ist ausdrücklich nur zum Testen bestimmt. Passwörter und Sitzung werden nicht sicher serverseitig verwaltet. Daten liegen ausschließlich im `localStorage` des jeweiligen Browsers und werden nicht zwischen Geräten synchronisiert.

## Bedienung

Als `mama` kann eine Schichtkarte auf einen Kalendertag gezogen werden. Auf Touch-Geräten funktioniert dieselbe CDK-Drag-and-drop-Bedienung. Alternativ eine Schichtkarte anklicken und danach den Tag auswählen. Ein belegter Tag wird erst nach Bestätigung ersetzt. Ein Klick auf eine vorhandene Schicht öffnet Notiz, Schichtart und Löschfunktion.

Als `familie` bleiben Palette und sämtliche Schreibaktionen ausgeblendet. Die Kalenderdetails sind lesbar; die Daten- und Guard-Schicht weist Schreibversuche zusätzlich ab.

## Architektur

```text
apps/shift-calendar          App-Shell, Runtime-Konfiguration, Lazy Routes
libs/core/auth               Auth-Repositories, Signal-State, Guards, Login
libs/core/data-access        Storage-Abstraktion, Runtime-Config, Supabase-Client
libs/shared/models           Frameworkarme Domainmodelle und lokale Datumslogik
libs/shared/ui               wiederverwendbarer, Reduced-Motion-fähiger Motion-Service
libs/calendar/feature        Kalender-Use-Cases und Seitenorchestrierung
libs/calendar/data-access    Repository-Interface, Local-/Supabase-Adapter, Signal-Store
libs/calendar/ui             präsentationale Kalender-, Palette- und Dialog-Komponenten
```

Komponenten greifen weder direkt auf `localStorage` noch auf Supabase zu. `AuthRepository` und `ShiftRepository` trennen die Betriebsarten. Der lokale Zustand wird mit Angular Signals verwaltet; alle Komponenten sind standalone und nutzen OnPush Change Detection. Kalender- und Loginroute werden lazy geladen.

Lokale Kalendertage werden ohne UTC-Konvertierung als `YYYY-MM-DD` konstruiert. Dadurch bleiben Tage auch in Zeitzonen mit Sommerzeit stabil.

## Supabase einrichten

1. Ein neues Supabase-Projekt erstellen.
2. Im SQL Editor den gesamten Inhalt von [`supabase/migrations/20260920120000_initial_shiftly.sql`](supabase/migrations/20260920120000_initial_shiftly.sql) ausführen. Alternativ mit installierter Supabase CLI: `supabase db push`.
3. Unter **Authentication → Users** die Familienkonten mit E-Mail-Adresse und Passwort anlegen.
4. Für jede Auth-UUID ein Profil einfügen. Nur das Verwaltungskonto erhält `admin`:

   ```sql
   insert into public.profiles (id, username, display_name, role)
   values
     ('UUID-DES-ADMIN-KONTOS', 'mama', 'Mama', 'admin'),
     ('UUID-DES-FAMILIEN-KONTOS', 'familie', 'Familie', 'viewer');
   ```

5. [`apps/shift-calendar/public/config.example.js`](apps/shift-calendar/public/config.example.js) als Vorlage für `apps/shift-calendar/public/config.js` verwenden:

   ```js
   globalThis.SHIFTLY_CONFIG = {
     supabaseUrl: 'https://DEIN-PROJEKT.supabase.co',
     supabaseAnonKey: 'DEIN_PUBLIC_ANON_KEY',
   };
   ```

6. App neu starten. Sobald beide Werte gesetzt sind, schaltet Shiftly automatisch in den Supabase-Modus. Beim Login wird dann die E-Mail-Adresse des Supabase-Auth-Benutzers verwendet.

Der öffentliche `anon`-Key ist für Browser-Clients vorgesehen; die Sicherheit entsteht durch RLS. Niemals den `service_role`-Key in `config.js`, Quellcode oder Build-Artefakte schreiben. Die Migration erlaubt allen authentifizierten Familienmitgliedern Lesezugriff. Insert, Update und Delete werden serverseitig ausschließlich für Profile mit Rolle `admin` freigegeben. Profile können aus dem Client nicht verändert werden, sodass kein Viewer seine Rolle hochstufen kann.

## Prüfungen

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Die Tests decken erfolgreichen und fehlgeschlagenen Login, Sitzungswiederherstellung, Rollenprüfung, Admin-CRUD, Viewer-Schreibschutz, Anlegen, Ersetzen, Löschen, Monatswechsel und lokale Persistenz ab.

## Hinweise zur Produktion

- `config.js` wird zur Laufzeit geladen, daher ist für verschiedene Deployments kein neuer Angular-Build nötig.
- Die Anwendung verwendet keine Service-Role-Zugangsdaten.
- Der Demo-Modus ist weder Mehrbenutzer- noch geräteübergreifend und darf nicht für sensible Einsatzdaten verwendet werden.
# shiftly
