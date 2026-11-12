import type { CaseStructure } from '../../types/schemas';

const AdministrativeOffenses = {
  PrioKonvertierungswahrscheinlichkeit: {
    label: 'Prio-Konvertierungswahrscheinlichkeit',
    type: 'number',
    id: '24668',
    category: 'Ordnungswidrigkeiten__Verkehrsstrafrecht',
  },
  CasecheckErmittlungsakteErfolgspruefungAnzahlFehlerAI: {
    label: 'Casecheck Ermittlungsakte - Erfolgsprüfung - Anzahl Fehler (AI)',
    type: 'number',
    id: '25954',
    category: 'Ordnungswidrigkeiten__Verkehrsstrafrecht',
  },
  CasecheckErmittlungsakteErfolgspruefungFehlerGefundenAI: {
    label: 'Casecheck Ermittlungsakte - Erfolgsprüfung - Fehler gefunden (AI)',
    type: 'select',
    id: '25946',
    category: 'Ordnungswidrigkeiten__Verkehrsstrafrecht',
  },
  CasecheckErmittlungsakteErfolgspruefungAnzahlFehlerFinal: {
    label: 'Casecheck Ermittlungsakte - Erfolgsprüfung - Anzahl Fehler (final)',
    type: 'number',
    id: '25955',
    category: 'Ordnungswidrigkeiten__Verkehrsstrafrecht',
  },
  CasecheckErmittlungsakteErfolgspruefungFehlerGefundenFinal: {
    label: 'Casecheck Ermittlungsakte - Erfolgsprüfung - Fehler gefunden (final)',
    type: 'select',
    id: '25956',
    category: 'Ordnungswidrigkeiten__Verkehrsstrafrecht',
  },
  CasecheckErmittlungsakteErfolgspruefungNaechsterSchritt: {
    label: 'Casecheck Ermittlungsakte - Erfolgsprüfung - Nächster Schritt',
    type: 'select',
    id: '25947',
    category: 'Ordnungswidrigkeiten__Verkehrsstrafrecht',
  },
  StrafrechtlicherTatvorwurf: {
    label: 'Strafrechtlicher Tatvorwurf',
    type: 'select',
    id: '25852',
    category: 'Ordnungswidrigkeiten__Verkehrsstrafrecht',
  },
  TerminsberichtVonTVAnfordernFormularUploads: {
    label: 'Terminsbericht von TV anfordern - Formular - Uploads',
    type: 'unknown',
    id: '28394',
    category: 'Ordnungswidrigkeiten__Verkehrsstrafrecht',
  },
} as const satisfies CaseStructure;
