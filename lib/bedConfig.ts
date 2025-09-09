// Bed configuration for OOC Steenokkerzeel

export interface RoomConfig {
  roomNumber: string;
  floor: 'ground' | 'first';
  building: 'noord' | 'zuid';
  maxBeds: number;
  specialization?: 'girls' | 'minors'; // girls = first floor noord, minors = first floor zuid (under 17)
}

export interface BedOccupancy {
  roomNumber: string;
  building: 'noord' | 'zuid';
  maxBeds: number;
  occupiedBeds: number;
  occupancyRate: number;
  residents: Array<{
    id: number;
    name: string;
    badge: number;
    bedNumber: number;
  }>;
}

// Noord building configuration
export const NOORD_ROOMS: RoomConfig[] = [
  // Begane Grond - actual bed counts
  { roomNumber: '1.06', floor: 'ground', building: 'noord', maxBeds: 4 },
  { roomNumber: '1.07', floor: 'ground', building: 'noord', maxBeds: 4 },
  { roomNumber: '1.08', floor: 'ground', building: 'noord', maxBeds: 5 },
  { roomNumber: '1.09', floor: 'ground', building: 'noord', maxBeds: 5 },
  
  // Eerste Verdieping - actual bed counts
  { roomNumber: '1.14', floor: 'first', building: 'noord', maxBeds: 1, specialization: 'medical' }, // medical room
  { roomNumber: '1.15', floor: 'first', building: 'noord', maxBeds: 3, specialization: 'girls' },
  { roomNumber: '1.16', floor: 'first', building: 'noord', maxBeds: 3, specialization: 'girls' },
  { roomNumber: '1.17', floor: 'first', building: 'noord', maxBeds: 3, specialization: 'girls' },
  { roomNumber: '1.18', floor: 'first', building: 'noord', maxBeds: 3, specialization: 'girls' },
  { roomNumber: '1.19', floor: 'first', building: 'noord', maxBeds: 3, specialization: 'girls' }
];

// Zuid building configuration
export const ZUID_ROOMS: RoomConfig[] = [
  // Begane Grond - actual bed counts
  { roomNumber: '2.06', floor: 'ground', building: 'zuid', maxBeds: 4 },
  { roomNumber: '2.07', floor: 'ground', building: 'zuid', maxBeds: 4 },
  { roomNumber: '2.08', floor: 'ground', building: 'zuid', maxBeds: 5 },
  { roomNumber: '2.09', floor: 'ground', building: 'zuid', maxBeds: 5 },
  
  // Eerste Verdieping - actual bed counts
  { roomNumber: '2.14', floor: 'first', building: 'zuid', maxBeds: 3, specialization: 'minors' },
  { roomNumber: '2.15', floor: 'first', building: 'zuid', maxBeds: 3, specialization: 'minors' },
  { roomNumber: '2.16', floor: 'first', building: 'zuid', maxBeds: 3, specialization: 'minors' },
  { roomNumber: '2.17', floor: 'first', building: 'zuid', maxBeds: 3, specialization: 'minors' },
  { roomNumber: '2.18', floor: 'first', building: 'zuid', maxBeds: 3, specialization: 'minors' },
  { roomNumber: '2.19', floor: 'first', building: 'zuid', maxBeds: 3, specialization: 'minors' }
];

// Combined room configurations
export const ALL_ROOMS: RoomConfig[] = [...NOORD_ROOMS, ...ZUID_ROOMS];

// Calculate total capacity with actual bed counts
export const CAPACITY = {
  noord: {
    ground: 18, // 4+4+5+5 = 18 beds
    first: 16,  // 1+3+3+3+3+3 = 16 beds  
    total: 34   // 18+16 = 34 beds
  },
  zuid: {
    ground: 18, // 4+4+5+5 = 18 beds
    first: 18,  // 3+3+3+3+3+3 = 18 beds
    total: 36   // 18+18 = 36 beds
  },
  get total() {
    return this.noord.total + this.zuid.total; // 70 total beds
  },
  // Additional properties for compatibility
  get TOTAL() { return this.total; },
  get NOORD() { return this.noord.total; },
  get ZUID() { return this.zuid.total; },
  get GIRLS_FLOOR() { return this.noord.first; },
  get MINORS_FLOOR() { return this.zuid.first; }
};

// Helper functions
export function getRoomConfig(roomNumber: string): RoomConfig | undefined {
  return ALL_ROOMS.find(room => room.roomNumber === roomNumber);
}

export function isGirlsRoom(roomNumber: string): boolean {
  const room = getRoomConfig(roomNumber);
  return room?.specialization === 'girls';
}

export function isMinorsRoom(roomNumber: string): boolean {
  const room = getRoomConfig(roomNumber);
  return room?.specialization === 'minors';
}

export function getRoomsByBuilding(building: 'noord' | 'zuid'): RoomConfig[] {
  return ALL_ROOMS.filter(room => room.building === building);
}

export function getRoomsByFloor(floor: 'ground' | 'first'): RoomConfig[] {
  return ALL_ROOMS.filter(room => room.floor === floor);
}