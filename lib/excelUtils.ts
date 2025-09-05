// Excel utility functions for data export

export interface ResidentData {
  id: number;
  badge: number;
  name: string;
  firstName: string;
  lastName: string;
  block: string;
  room: string;
  nationality: string;
  ovNumber: string;
  registerNumber: string;
  dateOfBirth: string;
  age: number;
  gender: string;
  referencePerson: string;
  dateIn: string;
  daysOfStay: number;
  status: string;
  // Kitchen/meal-related fields
  remarks?: string; // Kitchen-specific remarks
  roomRemarks?: string; // Room-specific remarks (Noord/Zuid)
  ontbijt?: boolean;
  middag?: boolean;
  snack16?: boolean;
  avond?: boolean;
  snack21?: boolean;
  // Database sync field
  dbId?: string; // Supabase database ID
}

// Sample data based on the PDF from OOC STEENOKKERZEEL
export const sampleData: ResidentData[] = [
  {
    id: 1,
    badge: 25097,
    name: 'Tchawou Allan Pharel',
    firstName: 'Allan Pharel',
    lastName: 'Tchawou',
    block: 'Noord',
    room: '2.17',
    nationality: 'Kameroen',
    ovNumber: '10225755',
    registerNumber: '10062028575',
    dateOfBirth: '2010-06-20',
    age: 15,
    gender: 'M',
    referencePerson: 'Bevers Chris',
    dateIn: '2025-05-05',
    daysOfStay: 110,
    status: 'active'
  },
  {
    id: 2,
    badge: 25112,
    name: 'Cherif Mohamed',
    firstName: 'Mohamed',
    lastName: 'Cherif',
    block: 'Noord',
    room: '2.09',
    nationality: 'Guinea',
    ovNumber: '10236814',
    registerNumber: '08090453788',
    dateOfBirth: '2008-09-04',
    age: 17,
    gender: 'M',
    referencePerson: 'Bevers Chris',
    dateIn: '2025-05-15',
    daysOfStay: 100,
    status: 'active'
  },
  {
    id: 3,
    badge: 25113,
    name: 'Conde Abdoul Karim',
    firstName: 'Abdoul Karim',
    lastName: 'Conde',
    block: 'Noord',
    room: '2.09',
    nationality: 'Guinée',
    ovNumber: '10236653',
    registerNumber: '8051649137',
    dateOfBirth: '2008-05-16',
    age: 17,
    gender: 'M',
    referencePerson: 'Bevers Chris',
    dateIn: '2025-05-15',
    daysOfStay: 100,
    status: 'active'
  },
  {
    id: 4,
    badge: 25121,
    name: 'Safi Ismail',
    firstName: 'Ismail',
    lastName: 'Safi',
    block: 'Noord',
    room: '2.15',
    nationality: 'Afghanistan',
    ovNumber: '10239904',
    registerNumber: '07093040501',
    dateOfBirth: '2007-09-30',
    age: 18,
    gender: 'M',
    referencePerson: 'Othman Didar',
    dateIn: '2025-05-20',
    daysOfStay: 95,
    status: 'active'
  },
  {
    id: 5,
    badge: 25137,
    name: 'Gebremeskel Awet Weldrufael',
    firstName: 'Awet Weldrufael',
    lastName: 'Gebremeskel',
    block: 'Noord',
    room: '2.18',
    nationality: 'Eritrea',
    ovNumber: '1024801',
    registerNumber: '09021052388',
    dateOfBirth: '2009-02-10',
    age: 16,
    gender: 'M',
    referencePerson: 'Bevers Chris',
    dateIn: '2025-06-03',
    daysOfStay: 82,
    status: 'active'
  },
  {
    id: 6,
    badge: 25140,
    name: 'Gergish Faniel Habtay',
    firstName: 'Faniel Habtay',
    lastName: 'Gergish',
    block: 'Zuid',
    room: '1.08',
    nationality: 'Eritrea',
    ovNumber: '10245908',
    registerNumber: '10040529120',
    dateOfBirth: '2010-04-05',
    age: 15,
    gender: 'M',
    referencePerson: 'Verhoeven Dorien',
    dateIn: '2025-06-03',
    daysOfStay: 82,
    status: 'active'
  }
];

// Filter data by block/section
export const getBewonerslijstData = () => sampleData;

export const getKeukenlijstData = () => 
  sampleData.map(resident => ({
    ...resident,
    remarks: resident.badge === 25172 ? 'Medicatie' : '', // Special note for one resident as per PDF
    kitchenSchedule: 'Week A', // Add kitchen-specific data
    mealPreference: 'Halal'
  }));

// Extended Noord room data matching the PDF structure
export const getNoordData = () => {
  const noordRoomData = [
    // Room 1.06
    { id: 101, bedNumber: 1, room: '1.06', lastName: 'Abdela', firstName: 'Selah Ali', nationality: 'Eritrea', language: 'Tigriyna', gender: 'M', remarks: '', badge: 25189 },
    { id: 102, bedNumber: 2, room: '1.06', lastName: 'Adhanom', firstName: 'Filmon Asfha', nationality: 'Ethiopië', language: 'Tigriyna', gender: 'M', remarks: '', badge: 25194 },
    { id: 103, bedNumber: 3, room: '1.06', lastName: 'Kahsay', firstName: 'Merhawi Mengstu', nationality: 'Eritrea', language: 'Tigriyna', gender: 'M', remarks: '', badge: 25195 },
    { id: 104, bedNumber: 4, room: '1.06', lastName: 'Kidanemariam', firstName: 'Kibrom Gebretsadkan', nationality: 'Eritrea', language: '', gender: 'M', remarks: '', badge: 25196 },
    
    // Room 1.07
    { id: 105, bedNumber: 1, room: '1.07', lastName: 'Abraha', firstName: 'Michael Kinfe', nationality: 'Eritrea', language: 'Tigrinya', gender: 'M', remarks: '10u30 transfer volw', badge: 25150 },
    { id: 106, bedNumber: 2, room: '1.07', lastName: 'Amine', firstName: 'Faniel Amanuel', nationality: 'Eritrea', language: 'Tigriyna', gender: 'M', remarks: '', badge: 25163 },
    { id: 107, bedNumber: 3, room: '1.07', lastName: 'Lemlem', firstName: 'Abel Mikiele', nationality: 'Eritrea', language: 'Tigriyna', gender: 'M', remarks: '10u30 transfer volw', badge: 25172 },
    { id: 108, bedNumber: 4, room: '1.07', lastName: 'Balde', firstName: 'Mamadou Saliou', nationality: 'Guinea', language: 'Frans', gender: 'M', remarks: '14u transfer met TOM', badge: 25175 },
    
    // Room 1.08
    { id: 109, bedNumber: 1, room: '1.08', lastName: 'Gergish', firstName: 'Faniel Habtay', nationality: 'Eritrea', language: 'Tigrinya', gender: 'M', remarks: '', badge: 25140 },
    { id: 110, bedNumber: 2, room: '1.08', lastName: 'Gebrehiwet', firstName: 'Dinar Gebremedhin', nationality: 'Ethiopië', language: 'Tigrinya', gender: 'M', remarks: '', badge: 25143 },
    { id: 111, bedNumber: 3, room: '1.08', lastName: 'Gebremaraim', firstName: 'Adhanom Measho', nationality: 'Eritrea', language: 'Tigrinya', gender: 'M', remarks: '', badge: 25159 },
    { id: 112, bedNumber: 4, room: '1.08', lastName: 'Habtemichael', firstName: 'Michaele Tewelde', nationality: 'Eritrea', language: 'Tigrinya', gender: 'M', remarks: '', badge: 25161 },
    { id: 113, bedNumber: 5, room: '1.08', lastName: 'Tewelde', firstName: 'Faniel Tesfaldet', nationality: 'Eritrea', language: 'Tigrinya', gender: 'M', remarks: '', badge: 25188 },
    
    // Room 1.09
    { id: 114, bedNumber: 1, room: '1.09', lastName: 'Tesfazghi', firstName: 'Abel Kesete', nationality: 'Eritrea', language: 'Tigrinya', gender: 'M', remarks: '', badge: 25142 },
    { id: 115, bedNumber: 2, room: '1.09', lastName: 'Haile', firstName: 'Amaniel Abraham', nationality: 'Eritrea', language: 'Tigriyna', gender: 'M', remarks: '', badge: 25152 },
    { id: 116, bedNumber: 3, room: '1.09', lastName: 'Haile', firstName: 'Merhawi Weldu', nationality: 'Eritrea', language: 'Tigriyna', gender: 'M', remarks: '', badge: 25154 },
    { id: 117, bedNumber: 4, room: '1.09', lastName: 'Gebrezgabiher', firstName: 'Thomas Zeray', nationality: 'Eritrea', language: 'Tigriyna', gender: 'M', remarks: '', badge: 25200 },
    { id: 118, bedNumber: 5, room: '1.09', lastName: 'Kidane', firstName: 'Daniel Berhe', nationality: 'Eritrea', language: 'Tigriyna', gender: 'M', remarks: '8u Thuisverpleging', badge: 25201 },
    
    // Room 1.16
    { id: 119, bedNumber: 1, room: '1.16', lastName: 'Mirfat', firstName: 'Issa Stephen', nationality: 'Tanzania', language: 'Engels/Swahili', gender: 'V', remarks: '9u MED', badge: 25198 },
    { id: 120, bedNumber: 2, room: '1.16', lastName: 'Abunaja', firstName: 'Wafa M I', nationality: 'Palestina', language: 'Arabisch', gender: 'V', remarks: '', badge: 25209 },
    
    // Room 1.17
    { id: 121, bedNumber: 1, room: '1.17', lastName: 'Sahle', firstName: 'Ruta Weldeslasie', nationality: 'Eritrea', language: 'Tigrinya', gender: 'V', remarks: '9u30 MED', badge: 25203 },
    { id: 122, bedNumber: 2, room: '1.17', lastName: 'Berhane', firstName: 'Muzit Mehari', nationality: 'Eritrea', language: 'Tigrinya', gender: 'V', remarks: '', badge: 25208 },
    
    // Room 1.18
    { id: 123, bedNumber: 1, room: '1.18', lastName: 'Teweldebrhan', firstName: 'Saba Teklezghi', nationality: 'Eritrea', language: 'Tigrinya', gender: 'V', remarks: '', badge: 25207 },
    
    // Room 1.19
    { id: 124, bedNumber: 1, room: '1.19', lastName: 'Kumbela', firstName: 'Marta Da Silva', nationality: 'Angola', language: 'Portugees', gender: 'V', remarks: '', badge: 25210 },
    { id: 125, bedNumber: 2, room: '1.19', lastName: 'Diallo', firstName: 'Aminata', nationality: 'Guinea', language: 'Peul', gender: 'V', remarks: '', badge: 25211 }
  ];
  
  return noordRoomData;
};

// Extended Zuid room data matching the PDF structure
export const getZuidData = () => {
  const zuidRoomData = [
    // Room 2.06
    { id: 201, bedNumber: 1, room: '2.06', lastName: 'Al Hamwi', firstName: 'Laith Kassem', nationality: 'Syrie', language: 'Arabisch', gender: 'M', remarks: '', badge: 25213 },
    { id: 202, bedNumber: 2, room: '2.06', lastName: 'Saleh', firstName: 'Ahmad', nationality: 'Syrie', language: 'Arabisch', gender: 'M', remarks: '', badge: 25214 },
    { id: 203, bedNumber: 3, room: '2.06', lastName: 'Hamdan', firstName: 'Youssef', nationality: 'Syrie', language: 'Arabisch', gender: 'M', remarks: '9u MED', badge: 25215 },
    { id: 204, bedNumber: 4, room: '2.06', lastName: 'Al Rashid', firstName: 'Omar', nationality: 'Syrie', language: 'Arabisch', gender: 'M', remarks: '', badge: 25216 },
    
    // Room 2.07  
    { id: 205, bedNumber: 1, room: '2.07', lastName: 'Bahati', firstName: 'Amani', nationality: 'DRC', language: 'Frans/Swahili', gender: 'V', remarks: '', badge: 25217 },
    { id: 206, bedNumber: 2, room: '2.07', lastName: 'Mukendi', firstName: 'Grace', nationality: 'DRC', language: 'Frans/Lingala', gender: 'V', remarks: '14u transfer', badge: 25218 },
    { id: 207, bedNumber: 3, room: '2.07', lastName: 'Nzuzi', firstName: 'Beatrice', nationality: 'DRC', language: 'Frans', gender: 'V', remarks: '', badge: 25219 },
    
    // Room 2.08
    { id: 208, bedNumber: 1, room: '2.08', lastName: 'Gergish', firstName: 'Faniel Habtay', nationality: 'Eritrea', language: 'Tigriyna', gender: 'M', remarks: '', badge: 25140 },
    { id: 209, bedNumber: 2, room: '2.08', lastName: 'Ahmed', firstName: 'Mustafa', nationality: 'Sudan', language: 'Arabisch', gender: 'M', remarks: '10u30 MED', badge: 25220 },
    { id: 210, bedNumber: 3, room: '2.08', lastName: 'Hassan', firstName: 'Ibrahim', nationality: 'Somalia', language: 'Somalisch', gender: 'M', remarks: '', badge: 25221 },
    { id: 211, bedNumber: 4, room: '2.08', lastName: 'Osman', firstName: 'Ali', nationality: 'Sudan', language: 'Arabisch', gender: 'M', remarks: '', badge: 25222 },
    
    // Room 2.09
    { id: 212, bedNumber: 1, room: '2.09', lastName: 'Cherif', firstName: 'Mohamed', nationality: 'Guinea', language: 'Frans/Peul', gender: 'M', remarks: '', badge: 25112 },
    { id: 213, bedNumber: 2, room: '2.09', lastName: 'Conde', firstName: 'Abdoul Karim', nationality: 'Guinée', language: 'Frans/Peul', gender: 'M', remarks: '', badge: 25113 },
    { id: 214, bedNumber: 3, room: '2.09', lastName: 'Barry', firstName: 'Mamadou', nationality: 'Guinea', language: 'Peul', gender: 'M', remarks: '8u30 transfer volw', badge: 25223 },
    
    // Room 2.15
    { id: 215, bedNumber: 1, room: '2.15', lastName: 'Safi', firstName: 'Ismail', nationality: 'Afghanistan', language: 'Dari/Pashto', gender: 'M', remarks: '', badge: 25121 },
    { id: 216, bedNumber: 2, room: '2.15', lastName: 'Ahmadi', firstName: 'Jawad', nationality: 'Afghanistan', language: 'Dari', gender: 'M', remarks: '9u30 MED', badge: 25224 },
    { id: 217, bedNumber: 3, room: '2.15', lastName: 'Nasiri', firstName: 'Hamid', nationality: 'Afghanistan', language: 'Pashto', gender: 'M', remarks: '', badge: 25225 },
    
    // Room 2.17
    { id: 218, bedNumber: 1, room: '2.17', lastName: 'Tchawou', firstName: 'Allan Pharel', nationality: 'Kameroen', language: 'Frans', gender: 'M', remarks: '', badge: 25097 },
    { id: 219, bedNumber: 2, room: '2.17', lastName: 'Nkem', firstName: 'Junior', nationality: 'Kameroen', language: 'Frans/Engels', gender: 'M', remarks: '15u transfer', badge: 25226 },
    
    // Room 2.18
    { id: 220, bedNumber: 1, room: '2.18', lastName: 'Gebremeskel', firstName: 'Awet Weldrufael', nationality: 'Eritrea', language: 'Tigriyna', gender: 'M', remarks: '', badge: 25137 },
    { id: 221, bedNumber: 2, room: '2.18', lastName: 'Tesfay', firstName: 'Berhe', nationality: 'Eritrea', language: 'Tigriyna', gender: 'M', remarks: '11u MED', badge: 25227 },
    { id: 222, bedNumber: 3, room: '2.18', lastName: 'Woldu', firstName: 'Mebrahtu', nationality: 'Eritrea', language: 'Tigriyna', gender: 'M', remarks: '', badge: 25228 }
  ];
  
  return zuidRoomData;
};

// Data utility functions for residents management
// Note: CSV/Excel download functionality has been removed per requirements