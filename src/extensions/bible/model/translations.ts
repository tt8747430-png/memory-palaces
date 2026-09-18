import type { BookCode } from './canon'

export interface BookTitle {
  name: string
  /** Short enough for a picker tile: `1Cor`, `Plâng`. */
  abbreviation: string
}

/**
 * A translation, and the names its book titles take. Proper nouns, not UI copy — a Romanian
 * translation's books are Romanian whatever the interface language — so they live here rather
 * than in the extension's messages.
 */
export interface Translation {
  id: string
  name: string
  shortName: string
  /** BCP 47. */
  language: string
  books: Readonly<Record<BookCode, BookTitle>>
}

/** code name|abbreviation, one book per line. */
const CORNILESCU_BOOKS = `
GEN Geneza|Gen
EXO Exodul|Exod
LEV Leviticul|Lev
NUM Numeri|Num
DEU Deuteronomul|Deut
JOS Iosua|Ios
JDG Judecători|Jud
RUT Rut|Rut
1SA 1 Samuel|1Sam
2SA 2 Samuel|2Sam
1KI 1 Împărați|1Împ
2KI 2 Împărați|2Împ
1CH 1 Cronici|1Cron
2CH 2 Cronici|2Cron
EZR Ezra|Ezra
NEH Neemia|Neem
EST Estera|Est
JOB Iov|Iov
PSA Psalmii|Ps
PRO Proverbele|Prov
ECC Eclesiastul|Ecl
SNG Cântarea cântărilor|Cânt
ISA Isaia|Is
JER Ieremia|Ier
LAM Plângerile lui Ieremia|Plâng
EZK Ezechiel|Ezec
DAN Daniel|Dan
HOS Osea|Osea
JOL Ioel|Ioel
AMO Amos|Amos
OBA Obadia|Obad
JON Iona|Iona
MIC Mica|Mica
NAM Naum|Naum
HAB Habacuc|Hab
ZEP Țefania|Țef
HAG Hagai|Hag
ZEC Zaharia|Zah
MAL Maleahi|Mal
MAT Matei|Mat
MRK Marcu|Marc
LUK Luca|Luca
JHN Ioan|Ioan
ACT Faptele apostolilor|Fapt
ROM Romani|Rom
1CO 1 Corinteni|1Cor
2CO 2 Corinteni|2Cor
GAL Galateni|Gal
EPH Efeseni|Ef
PHP Filipeni|Filip
COL Coloseni|Col
1TH 1 Tesaloniceni|1Tes
2TH 2 Tesaloniceni|2Tes
1TI 1 Timotei|1Tim
2TI 2 Timotei|2Tim
TIT Tit|Tit
PHM Filimon|Filim
HEB Evrei|Evr
JAS Iacov|Iac
1PE 1 Petru|1Pet
2PE 2 Petru|2Pet
1JN 1 Ioan|1Ioan
2JN 2 Ioan|2Ioan
3JN 3 Ioan|3Ioan
JUD Iuda|Iuda
REV Apocalipsa|Apoc
`

function parseTitles(table: string): Record<BookCode, BookTitle> {
  const titles: Partial<Record<BookCode, BookTitle>> = {}
  for (const line of table.trim().split('\n')) {
    const space = line.indexOf(' ')
    const [name = '', abbreviation = ''] = line.slice(space + 1).split('|')
    titles[line.slice(0, space) as BookCode] = { name, abbreviation }
  }
  return titles as Record<BookCode, BookTitle>
}

export const CORNILESCU_2024: Translation = {
  id: 'cornilescu-2024',
  name: 'Biblia Dumitru Cornilescu 2024',
  shortName: 'Cornilescu 2024',
  language: 'ro',
  books: parseTitles(CORNILESCU_BOOKS),
}

/** The one translation there is today: every reference, deck name and verse is in it. */
export const DEFAULT_TRANSLATION = CORNILESCU_2024.id

const TRANSLATIONS: ReadonlyMap<string, Translation> = new Map([
  [CORNILESCU_2024.id, CORNILESCU_2024],
])

export function findTranslation(id: string): Translation | undefined {
  return TRANSLATIONS.get(id)
}

/** An unknown id is shown as it is, upper-cased, the way translations are normally abbreviated. */
export function translationName(id: string): string {
  return findTranslation(id)?.name ?? id.toUpperCase()
}
