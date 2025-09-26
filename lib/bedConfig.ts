// Bed configuration for OOC Steenokkerzeel

export interface RoomConfig {
  roomNumber: string;
  floor: "ground" | "first";
  building: "noord" | "zuid";
  maxBeds: number;
  specialization?: "girls" | "minors" | "medical"; // girls = first floor noord, minors = first floor zuid (under 17), medical = special medical rooms
}

export interface BedOccupancy {
  roomNumber: string;
  building: "noord" | "zuid";
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
  // Begane Grond - boys
  { roomNumber: "1.06", floor: "ground", building: "noord", maxBeds: 4 },
  { roomNumber: "1.07", floor: "ground", building: "noord", maxBeds: 4 },
  { roomNumber: "1.08", floor: "ground", building: "noord", maxBeds: 4 },
  { roomNumber: "1.09", floor: "ground", building: "noord", maxBeds: 4 },

  // Eerste Verdieping - girls and medical (1.14 is office, not included)
  {
    roomNumber: "1.15",
    floor: "first",
    building: "noord",
    maxBeds: 1,
    specialization: "medical",
  }, // 1 medical bed
  {
    roomNumber: "1.16",
    floor: "first",
    building: "noord",
    maxBeds: 3,
    specialization: "girls",
  },
  {
    roomNumber: "1.17",
    floor: "first",
    building: "noord",
    maxBeds: 3,
    specialization: "girls",
  },
  {
    roomNumber: "1.18",
    floor: "first",
    building: "noord",
    maxBeds: 3,
    specialization: "girls",
  },
  {
    roomNumber: "1.19",
    floor: "first",
    building: "noord",
    maxBeds: 3,
    specialization: "girls",
  },
];

// Zuid building configuration
export const ZUID_ROOMS: RoomConfig[] = [
  // Begane Grond - boys only
  { roomNumber: "2.06", floor: "ground", building: "zuid", maxBeds: 4 },
  { roomNumber: "2.07", floor: "ground", building: "zuid", maxBeds: 4 },
  { roomNumber: "2.08", floor: "ground", building: "zuid", maxBeds: 5 },

  // Eerste Verdieping - boys and medical
  { roomNumber: "2.14", floor: "first", building: "zuid", maxBeds: 3 }, // boys
  { roomNumber: "2.15", floor: "first", building: "zuid", maxBeds: 3 }, // boys
  { roomNumber: "2.16", floor: "first", building: "zuid", maxBeds: 3 }, // boys
  { roomNumber: "2.17", floor: "first", building: "zuid", maxBeds: 3 }, // boys
  { roomNumber: "2.18", floor: "first", building: "zuid", maxBeds: 3 }, // boys
  {
    roomNumber: "2.19",
    floor: "first",
    building: "zuid",
    maxBeds: 3,
    specialization: "medical",
  }, // 3 medical beds
];

// Combined room configurations
export const ALL_ROOMS: RoomConfig[] = [...NOORD_ROOMS, ...ZUID_ROOMS];

// Calculate total capacity with actual bed counts
export const CAPACITY = {
  noord: {
    ground: 16, // 4+4+4+4 = 16 beds (boys)
    first: 13, // 1(medical)+3+3+3+3 = 13 beds (1 medical + 12 girls) - no 1.14 (office)
    total: 29, // 16+13 = 29 beds
  },
  zuid: {
    ground: 13, // 4+4+5 = 13 beds (boys only)
    first: 18, // 3+3+3+3+3+3 = 18 beds (15 boys + 3 medical)
    total: 31, // 13+18 = 31 beds
  },
  get total() {
    return this.noord.total + this.zuid.total; // 60 total beds
  },
  get boys() {
    return 44; // 16 (noord ground) + 13 (zuid ground) + 15 (zuid first) = 44 boys
  },
  get girls() {
    return 12; // 12 (noord first 1.16-1.19) = 12 girls
  },
  get medical() {
    return 4; // 1 in room 1.15 + 3 in room 2.19
  },
  // Additional properties for compatibility
  get TOTAL() {
    return this.total;
  },
  get NOORD() {
    return this.noord.total;
  },
  get ZUID() {
    return this.zuid.total;
  },
  get GIRLS_FLOOR() {
    return 15;
  },
  get BOYS_BEDS() {
    return this.boys;
  },
  get MEDICAL_BEDS() {
    return this.medical;
  },
};

// Helper functions
export function getRoomConfig(roomNumber: string): RoomConfig | undefined {
  return ALL_ROOMS.find((room) => room.roomNumber === roomNumber);
}

export function isGirlsRoom(roomNumber: string): boolean {
  const room = getRoomConfig(roomNumber);
  return room?.specialization === "girls";
}

export function isMinorsRoom(roomNumber: string): boolean {
  const room = getRoomConfig(roomNumber);
  return room?.specialization === "minors";
}

export function getRoomsByBuilding(building: "noord" | "zuid"): RoomConfig[] {
  return ALL_ROOMS.filter((room) => room.building === building);
}

export function getRoomsByFloor(floor: "ground" | "first"): RoomConfig[] {
  return ALL_ROOMS.filter((room) => room.floor === floor);
}
