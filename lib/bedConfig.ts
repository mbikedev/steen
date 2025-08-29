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
  // Ground floor - 4 rooms with 4, 4, 5, 5 beds
  { roomNumber: '1.06', floor: 'ground', building: 'noord', maxBeds: 4 },
  { roomNumber: '1.07', floor: 'ground', building: 'noord', maxBeds: 4 },
  { roomNumber: '1.08', floor: 'ground', building: 'noord', maxBeds: 5 },
  { roomNumber: '1.09', floor: 'ground', building: 'noord', maxBeds: 5 },
  
  // First floor - 6 rooms for girls only with 3, 3, 3, 3, 3, 3 beds
  { roomNumber: '1.14', floor: 'first', building: 'noord', maxBeds: 3, specialization: 'girls' },
  { roomNumber: '1.15', floor: 'first', building: 'noord', maxBeds: 3, specialization: 'girls' },
  { roomNumber: '1.16', floor: 'first', building: 'noord', maxBeds: 3, specialization: 'girls' },
  { roomNumber: '1.17', floor: 'first', building: 'noord', maxBeds: 3, specialization: 'girls' },
  { roomNumber: '1.18', floor: 'first', building: 'noord', maxBeds: 3, specialization: 'girls' },
  { roomNumber: '1.19', floor: 'first', building: 'noord', maxBeds: 3, specialization: 'girls' }
];

// Zuid building configuration
export const ZUID_ROOMS: RoomConfig[] = [
  // Ground floor - 4 rooms with 4, 4, 5, 5 beds
  { roomNumber: '2.06', floor: 'ground', building: 'zuid', maxBeds: 4 },
  { roomNumber: '2.07', floor: 'ground', building: 'zuid', maxBeds: 4 },
  { roomNumber: '2.08', floor: 'ground', building: 'zuid', maxBeds: 5 },
  { roomNumber: '2.09', floor: 'ground', building: 'zuid', maxBeds: 5 },
  
  // First floor - 5 rooms for minors under 17 with 3, 3, 3, 3, 3 beds
  { roomNumber: '2.14', floor: 'first', building: 'zuid', maxBeds: 3, specialization: 'minors' },
  { roomNumber: '2.15', floor: 'first', building: 'zuid', maxBeds: 3, specialization: 'minors' },
  { roomNumber: '2.16', floor: 'first', building: 'zuid', maxBeds: 3, specialization: 'minors' },
  { roomNumber: '2.17', floor: 'first', building: 'zuid', maxBeds: 3, specialization: 'minors' },
  { roomNumber: '2.18', floor: 'first', building: 'zuid', maxBeds: 3, specialization: 'minors' }
];

// Combined room configurations
export const ALL_ROOMS: RoomConfig[] = [...NOORD_ROOMS, ...ZUID_ROOMS];

// Calculate total capacity
export const CAPACITY = {
  noord: {
    ground: NOORD_ROOMS.filter(r => r.floor === 'ground').reduce((sum, r) => sum + r.maxBeds, 0),
    first: NOORD_ROOMS.filter(r => r.floor === 'first').reduce((sum, r) => sum + r.maxBeds, 0),
    total: NOORD_ROOMS.reduce((sum, r) => sum + r.maxBeds, 0)
  },
  zuid: {
    ground: ZUID_ROOMS.filter(r => r.floor === 'ground').reduce((sum, r) => sum + r.maxBeds, 0),
    first: ZUID_ROOMS.filter(r => r.floor === 'first').reduce((sum, r) => sum + r.maxBeds, 0),
    total: ZUID_ROOMS.reduce((sum, r) => sum + r.maxBeds, 0)
  },
  get total() {
    return this.noord.total + this.zuid.total;
  }
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