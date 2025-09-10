// Utility functions for mapping nationalities to official languages

/**
 * Maps nationality to the speaking languages of that country (2-3 most common)
 * @param nationality - The nationality/country name
 * @returns Array of common languages spoken in that country
 */
export function getLanguagesByNationality(nationality: string | null | undefined): string[] {
  if (!nationality) return [];
  
  // Normalize the nationality string (lowercase, trim spaces)
  const normalizedNationality = nationality.toLowerCase().trim();
  
  // Comprehensive mapping of countries to their speaking languages (2-3 most common)
  const nationalityToLanguages: { [key: string]: string[] } = {
    // European Countries
    'nederland': ['Nederlands'],
    'nederlands': ['Nederlands'],
    'holland': ['Nederlands'],
    'belgium': ['Nederlands', 'Frans'],
    'belgie': ['Nederlands', 'Frans'],
    'belgisch': ['Nederlands', 'Frans'],
    
    'duitsland': ['Duits'],
    'duits': ['Duits'],
    'germany': ['Duits'],
    'german': ['Duits'],
    'oostenrijk': ['Duits'],
    'austria': ['Duits'],
    'zwitserland': ['Duits', 'Frans', 'Italiaans'],
    'switzerland': ['Duits', 'Frans', 'Italiaans'],
    
    'frankrijk': ['Frans'],
    'france': ['Frans'],
    'french': ['Frans'],
    'frans': ['Frans'],
    
    'spanje': ['Spaans', 'Catalaans'],
    'spain': ['Spaans', 'Catalaans'],
    'spaans': ['Spaans', 'Catalaans'],
    'spanish': ['Spaans', 'Catalaans'],
    
    'italie': ['Italiaans'],
    'italy': ['Italiaans'],
    'italian': ['Italiaans'],
    'italiaans': ['Italiaans'],
    
    'portugal': ['Portugees'],
    'portugees': ['Portugees'],
    'portuguese': ['Portugees'],
    
    'griekenland': ['Grieks'],
    'greece': ['Grieks'],
    'grieks': ['Grieks'],
    'greek': ['Grieks'],
    
    'rusland': ['Russisch'],
    'russia': ['Russisch'],
    'russisch': ['Russisch'],
    'russian': ['Russisch'],
    
    'polen': ['Pools'],
    'poland': ['Pools'],
    'polish': ['Pools'],
    'pools': ['Pools'],
    
    'roemenie': ['Roemeens'],
    'romania': ['Roemeens'],
    'roemeens': ['Roemeens'],
    'romanian': ['Roemeens'],
    
    'bulgarije': ['Bulgaars'],
    'bulgaria': ['Bulgaars'],
    'bulgaars': ['Bulgaars'],
    'bulgarian': ['Bulgaars'],
    
    'hongarije': ['Hongaars'],
    'hungary': ['Hongaars'],
    'hongaars': ['Hongaars'],
    'hungarian': ['Hongaars'],
    
    'tsjechie': ['Tsjechisch'],
    'czech republic': ['Tsjechisch'],
    'tsjechisch': ['Tsjechisch'],
    'czech': ['Tsjechisch'],
    
    'slovakije': ['Slowaaks'],
    'slovakia': ['Slowaaks'],
    'slowaaks': ['Slowaaks'],
    'slovak': ['Slowaaks'],
    
    'kroatie': ['Kroatisch'],
    'croatia': ['Kroatisch'],
    'kroatisch': ['Kroatisch'],
    'croatian': ['Kroatisch'],
    
    'servie': ['Servisch'],
    'serbia': ['Servisch'],
    'servisch': ['Servisch'],
    'serbian': ['Servisch'],
    
    'bosnie': ['Bosnisch'],
    'bosnia': ['Bosnisch'],
    'bosnisch': ['Bosnisch'],
    'bosnian': ['Bosnisch'],
    
    'albanie': ['Albanees'],
    'albania': ['Albanees'],
    'albanees': ['Albanees'],
    'albanian': ['Albanees'],
    
    'macedonie': ['Macedonisch'],
    'macedonia': ['Macedonisch'],
    'macedonisch': ['Macedonisch'],
    'macedonian': ['Macedonisch'],
    
    'montenegro': ['Montenegrijns'],
    'montenegrijns': ['Montenegrijns'],
    
    'slovenie': ['Sloveens'],
    'slovenia': ['Sloveens'],
    'sloveens': ['Sloveens'],
    'slovenian': ['Sloveens'],
    
    'engeland': ['Engels'],
    'england': ['Engels'],
    'uk': ['Engels'],
    'united kingdom': ['Engels'],
    'britain': ['Engels'],
    'engels': ['Engels'],
    'english': ['Engels'],
    'groot-brittannie': ['Engels'],
    'ierland': ['Engels', 'Iers'],
    'ireland': ['Engels', 'Iers'],
    'irish': ['Engels', 'Iers'],
    
    'denemarken': ['Deens'],
    'denmark': ['Deens'],
    'deens': ['Deens'],
    'danish': ['Deens'],
    
    'zweden': ['Zweeds'],
    'sweden': ['Zweeds'],
    'zweeds': ['Zweeds'],
    'swedish': ['Zweeds'],
    
    'noorwegen': ['Noors'],
    'norway': ['Noors'],
    'noors': ['Noors'],
    'norwegian': ['Noors'],
    
    'finland': ['Fins'],
    'fins': ['Fins'],
    'finnish': ['Fins'],
    
    'ijsland': ['IJslands'],
    'iceland': ['IJslands'],
    'ijslands': ['IJslands'],
    'icelandic': ['IJslands'],
    
    // Middle East & Asia
    'syrie': ['Arabisch', 'Koerdisch'],
    'syria': ['Arabisch', 'Koerdisch'],
    'syrian': ['Arabisch', 'Koerdisch'],
    'syrisch': ['Arabisch', 'Koerdisch'],
    
    'irak': ['Arabisch', 'Koerdisch'],
    'iraq': ['Arabisch', 'Koerdisch'],
    'iraqi': ['Arabisch', 'Koerdisch'],
    'irakees': ['Arabisch', 'Koerdisch'],
    
    'iran': ['Perzisch', 'Azeri'],
    'perzisch': ['Perzisch', 'Azeri'],
    'persian': ['Perzisch', 'Azeri'],
    'farsi': ['Perzisch', 'Azeri'],
    
    'afghanistan': ['Dari', 'Pashto'],
    'afghaans': ['Dari', 'Pashto'],
    'afghan': ['Dari', 'Pashto'],
    
    'turkije': ['Turks', 'Koerdisch'],
    'turkey': ['Turks', 'Koerdisch'],
    'turks': ['Turks', 'Koerdisch'],
    'turkish': ['Turks', 'Koerdisch'],
    
    'libanon': ['Arabisch'],
    'lebanon': ['Arabisch'],
    'lebanese': ['Arabisch'],
    'libanees': ['Arabisch'],
    
    'jordanie': ['Arabisch'],
    'jordan': ['Arabisch'],
    'jordanian': ['Arabisch'],
    'jordaans': ['Arabisch'],
    
    'palestina': ['Arabisch'],
    'palestine': ['Arabisch'],
    'palestinian': ['Arabisch'],
    'palestijns': ['Arabisch'],
    
    'israel': ['Hebreeuws', 'Arabisch'],
    'israeli': ['Hebreeuws', 'Arabisch'],
    'israelisch': ['Hebreeuws', 'Arabisch'],
    'hebrew': ['Hebreeuws', 'Arabisch'],
    'hebreeuws': ['Hebreeuws', 'Arabisch'],
    
    'saudi-arabie': ['Arabisch'],
    'saudi arabia': ['Arabisch'],
    'saudi': ['Arabisch'],
    'saudisch': ['Arabisch'],
    
    'egypte': ['Arabisch'],
    'egypt': ['Arabisch'],
    'egyptian': ['Arabisch'],
    'egyptisch': ['Arabisch'],
    
    'marokko': ['Arabisch', 'Berbers'],
    'morocco': ['Arabisch', 'Berbers'],
    'moroccan': ['Arabisch', 'Berbers'],
    'marokkaans': ['Arabisch', 'Berbers'],
    
    'tunesie': ['Arabisch'],
    'tunisia': ['Arabisch'],
    'tunisian': ['Arabisch'],
    'tunesisch': ['Arabisch'],
    
    'algerije': ['Arabisch', 'Berbers'],
    'algeria': ['Arabisch', 'Berbers'],
    'algerian': ['Arabisch', 'Berbers'],
    'algerijns': ['Arabisch', 'Berbers'],
    
    'libie': ['Arabisch'],
    'libya': ['Arabisch'],
    'libyan': ['Arabisch'],
    'libisch': ['Arabisch'],
    
    'china': ['Chinees', 'Mandarijn'],
    'chinese': ['Chinees', 'Mandarijn'],
    'chinees': ['Chinees', 'Mandarijn'],
    
    'japan': ['Japans'],
    'japanese': ['Japans'],
    'japans': ['Japans'],
    
    'india': ['Hindi', 'Engels'],
    'indian': ['Hindi', 'Engels'],
    'indisch': ['Hindi', 'Engels'],
    'hindi': ['Hindi', 'Engels'],
    
    'pakistan': ['Urdu', 'Engels'],
    'pakistani': ['Urdu', 'Engels'],
    'pakistaans': ['Urdu', 'Engels'],
    'urdu': ['Urdu', 'Engels'],
    
    'bangladesh': ['Bengaals'],
    'bangladeshi': ['Bengaals'],
    'bengali': ['Bengaals'],
    'bengaals': ['Bengaals'],
    
    'korea': ['Koreaans'],
    'korean': ['Koreaans'],
    'koreaans': ['Koreaans'],
    'zuid-korea': ['Koreaans'],
    'south korea': ['Koreaans'],
    
    'vietnam': ['Vietnamees'],
    'vietnamese': ['Vietnamees'],
    'vietnamees': ['Vietnamees'],
    
    'thailand': ['Thais'],
    'thai': ['Thais'],
    'thais': ['Thais'],
    
    'indonesie': ['Indonesisch'],
    'indonesia': ['Indonesisch'],
    'indonesian': ['Indonesisch'],
    'indonesisch': ['Indonesisch'],
    
    'filipijnen': ['Filipijns', 'Engels'],
    'philippines': ['Filipijns', 'Engels'],
    'filipino': ['Filipijns', 'Engels'],
    'filipijns': ['Filipijns', 'Engels'],
    
    // Africa
    'nigeria': ['Engels', 'Hausa'],
    'nigerian': ['Engels', 'Hausa'],
    'nigeriaans': ['Engels', 'Hausa'],
    
    'ethiopie': ['Amhaars', 'Oromo'],
    'ethiopia': ['Amhaars', 'Oromo'],
    'ethiopian': ['Amhaars', 'Oromo'],
    'ethiopisch': ['Amhaars', 'Oromo'],
    
    'kenya': ['Swahili', 'Engels'],
    'kenyan': ['Swahili', 'Engels'],
    'keniaans': ['Swahili', 'Engels'],
    
    'tanzania': ['Swahili', 'Engels'],
    'tanzanian': ['Swahili', 'Engels'],
    'tanzaniaans': ['Swahili', 'Engels'],
    
    'uganda': ['Engels', 'Swahili'],
    'ugandan': ['Engels', 'Swahili'],
    'ugandees': ['Engels', 'Swahili'],
    
    'rwanda': ['Kinyarwanda', 'Engels'],
    'rwandan': ['Kinyarwanda', 'Engels'],
    'rwandees': ['Kinyarwanda', 'Engels'],
    
    'burundi': ['Kirundi', 'Frans'],
    'burundian': ['Kirundi', 'Frans'],
    'burundees': ['Kirundi', 'Frans'],
    
    'congo': ['Frans', 'Lingala'],
    'congolese': ['Frans', 'Lingala'],
    'congolees': ['Frans', 'Lingala'],
    
    'ghana': ['Engels', 'Twi'],
    'ghanaian': ['Engels', 'Twi'],
    'ghanees': ['Engels', 'Twi'],
    
    'zuid-afrika': ['Engels', 'Afrikaans'],
    'south africa': ['Engels', 'Afrikaans'],
    'south african': ['Engels', 'Afrikaans'],
    'zuid-afrikaans': ['Engels', 'Afrikaans'],
    
    // Americas
    'amerika': ['Engels'],
    'america': ['Engels'],
    'usa': ['Engels'],
    'united states': ['Engels'],
    'amerikaans': ['Engels'],
    'american': ['Engels'],
    
    'canada': ['Engels', 'Frans'],
    'canadian': ['Engels', 'Frans'],
    'canadees': ['Engels', 'Frans'],
    
    'mexico': ['Spaans'],
    'mexican': ['Spaans'],
    'mexicaans': ['Spaans'],
    
    'brazilie': ['Portugees'],
    'brazil': ['Portugees'],
    'brazilian': ['Portugees'],
    'braziliaans': ['Portugees'],
    
    'argentinie': ['Spaans'],
    'argentina': ['Spaans'],
    'argentinian': ['Spaans'],
    'argentijns': ['Spaans'],
    
    'chili': ['Spaans'],
    'chile': ['Spaans'],
    'chilean': ['Spaans'],
    'chileens': ['Spaans'],
    
    'peru': ['Spaans', 'Quechua'],
    'peruvian': ['Spaans', 'Quechua'],
    'peruaans': ['Spaans', 'Quechua'],
    
    'colombia': ['Spaans'],
    'colombian': ['Spaans'],
    'colombiaans': ['Spaans'],
    
    'venezuela': ['Spaans'],
    'venezuelan': ['Spaans'],
    'venezolaans': ['Spaans'],
    
    'ecuador': ['Spaans', 'Quechua'],
    'ecuadorian': ['Spaans', 'Quechua'],
    'ecuadoriaans': ['Spaans', 'Quechua'],
    
    'bolivia': ['Spaans', 'Quechua'],
    'bolivian': ['Spaans', 'Quechua'],
    'boliviaans': ['Spaans', 'Quechua'],
    
    'uruguay': ['Spaans'],
    'uruguayan': ['Spaans'],
    'uruguayaans': ['Spaans'],
    
    'paraguay': ['Spaans', 'Guarani'],
    'paraguayan': ['Spaans', 'Guarani'],
    'paraguayaans': ['Spaans', 'Guarani'],
    
    // Oceania
    'australie': ['Engels'],
    'australia': ['Engels'],
    'australian': ['Engels'],
    'australisch': ['Engels'],
    
    'nieuw-zeeland': ['Engels', 'Maori'],
    'new zealand': ['Engels', 'Maori'],
    'new zealander': ['Engels', 'Maori'],
    'nieuw-zeelands': ['Engels', 'Maori'],
    
    // Additional variants and common misspellings
    'nederlandse': ['Nederlands'],
    'hollands': ['Nederlands'],
    'flemish': ['Nederlands'],
    'vlaams': ['Nederlands'],
    
    'deutsche': ['Duits'],
    
    'francais': ['Frans'],
    'francaise': ['Frans'],
    
    'espanol': ['Spaans'],
    'espanola': ['Spaans'],
    
    'italiano': ['Italiaans'],
    'italiana': ['Italiaans'],
    
    'portugues': ['Portugees'],
    'portuguesa': ['Portugees'],
    
    'arabic': ['Arabisch'],
    'arab': ['Arabisch'],
    'arabisch': ['Arabisch'],
    
    'kurdish': ['Koerdisch'],
    'kurd': ['Koerdisch'],
    'koerdisch': ['Koerdisch'],
    'kurds': ['Koerdisch'],
    'koerds': ['Koerdisch'],
  };
  
  // First try exact match
  if (nationalityToLanguages[normalizedNationality]) {
    return nationalityToLanguages[normalizedNationality];
  }
  
  // Try partial matching for compound words or variations
  for (const [country, languages] of Object.entries(nationalityToLanguages)) {
    if (normalizedNationality.includes(country) || country.includes(normalizedNationality)) {
      return languages;
    }
  }
  
  // Default fallback - return empty array if no match found
  return [];
}

/**
 * Maps nationality to the primary official language of that country (backward compatibility)
 * @param nationality - The nationality/country name
 * @returns The primary official language in Dutch
 */
export function getOfficialLanguageByNationality(nationality: string | null | undefined): string {
  const languages = getLanguagesByNationality(nationality);
  return languages.length > 0 ? languages[0] : '';
}

/**
 * Get available languages list for autocomplete
 */
export function getAvailableLanguages(): string[] {
  return [
    'Nederlands',
    'Engels',
    'Frans',
    'Duits',
    'Spaans',
    'Italiaans',
    'Portugees',
    'Arabisch',
    'Turks',
    'Russisch',
    'Pools',
    'Roemeens',
    'Bulgaars',
    'Hongaars',
    'Tsjechisch',
    'Slowaaks',
    'Kroatisch',
    'Servisch',
    'Bosnisch',
    'Albanees',
    'Grieks',
    'Chinees',
    'Mandarijn',
    'Japans',
    'Koreaans',
    'Hindi',
    'Urdu',
    'Bengaals',
    'Vietnamees',
    'Thais',
    'Indonesisch',
    'Filipijns',
    'Swahili',
    'Amhaars',
    'Perzisch',
    'Dari',
    'Hebreeuws',
    'Koerdisch',
    'Catalaans',
    'Afrikaans',
    'Berbers',
    'Hausa',
    'Oromo',
    'Twi',
    'Lingala',
    'Kinyarwanda',
    'Kirundi',
    'Quechua',
    'Guarani',
    'Maori',
    'Iers',
    'Deens',
    'Zweeds',
    'Noors',
    'Fins',
    'IJslands',
    'Montenegrijns',
    'Sloveens',
    'Macedonisch',
    'Azeri',
    'Pashto'
  ];
}