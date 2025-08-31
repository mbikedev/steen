/**
 * API Service for PHP Backend Integration
 * Connects to Hostinger PHP/MySQL backend
 */

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://your-domain.com/api/php';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'your_secure_api_key_here';

// Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}

export interface ResidentData {
  id?: number;
  badge: number;
  firstName: string;
  lastName: string;
  name?: string;
  room?: string;
  nationality?: string;
  ovNumber?: string;
  registerNumber?: string;
  dateOfBirth?: string;
  age?: number;
  gender?: 'M' | 'F' | 'X';
  referencePerson?: string;
  dateIn?: string;
  daysOfStay?: number;
  status?: string;
  remarks?: string;
  roomRemarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Helper function for API calls
async function apiCall<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const headers: HeadersInit = {
      'X-Api-Key': API_KEY,
      ...options.headers,
    };

    // Only set Content-Type to application/json if no Content-Type is specified
    // and the body is not FormData (which needs multipart/form-data)
    if (!options.headers || !('Content-Type' in options.headers)) {
      if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }
    }

    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // Try to get error details from response
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
        console.error('🚨 API Error Details:', errorData);
      } catch (e) {
        // Response might not be JSON
        const errorText = await response.text();
        console.error('🚨 API Error Response:', errorText);
        if (errorText) errorMessage = errorText;
      }
      throw new Error(errorMessage);
    }

    // Check if response has content
    const contentType = response.headers.get("content-type");
    const contentLength = response.headers.get("content-length");
    
    if (!contentType || !contentType.includes("application/json")) {
      console.warn('⚠️ Response is not JSON, might be HTML error page');
      const text = await response.text();
      console.log('Response text:', text.substring(0, 500));
      // Return a fallback response
      return {
        success: false,
        error: 'Invalid response format from server'
      };
    }

    // Handle empty responses
    if (contentLength === "0") {
      console.warn('⚠️ Empty response from server');
      return {
        success: false,
        error: 'Empty response from server'
      };
    }

    try {
      const data = await response.json();
      return data;
    } catch (jsonError) {
      console.error('Failed to parse JSON:', jsonError);
      const text = await response.text();
      console.log('Response that failed to parse:', text.substring(0, 500));
      return {
        success: false,
        error: 'Failed to parse server response'
      };
    }
  } catch (error) {
    console.error('API call failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

// Residents API
export const residentsApi = {
  // Get all residents
  async getAll(filters?: {
    room?: string;
    status?: string;
  }): Promise<ApiResponse<ResidentData[]>> {
    const params = new URLSearchParams(filters as any).toString();
    const endpoint = params ? `?endpoint=residents&${params}` : '?endpoint=residents';
    return apiCall<ResidentData[]>(endpoint);
  },

  // Get single resident
  async getById(id: number): Promise<ApiResponse<ResidentData>> {
    return apiCall<ResidentData>(`?endpoint=residents&id=${id}`);
  },

  // Create new resident
  async create(resident: ResidentData): Promise<ApiResponse<ResidentData>> {
    return apiCall<ResidentData>('?endpoint=residents', {
      method: 'POST',
      body: JSON.stringify(resident),
    });
  },

  // Update resident
  async update(id: number, updates: Partial<ResidentData>): Promise<ApiResponse<ResidentData>> {
    return apiCall<ResidentData>(`?endpoint=residents&id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete resident (soft delete)
  async delete(id: number): Promise<ApiResponse> {
    return apiCall(`?endpoint=residents&id=${id}`, {
      method: 'DELETE',
    });
  },

  // Batch create residents
  async createBatch(residents: ResidentData[]): Promise<ApiResponse<ResidentData[]>> {
    return apiCall<ResidentData[]>('residents-batch.php', {
      method: 'POST',
      body: JSON.stringify({ residents }),
    });
  },
};

// Rooms API
export const roomsApi = {
  // Get room occupancy
  async getOccupancy(): Promise<ApiResponse> {
    return apiCall('rooms.php?view=occupancy');
  },

  // Update room assignment
  async assignResident(roomNumber: string, residentId: number): Promise<ApiResponse> {
    return apiCall('rooms.php', {
      method: 'POST',
      body: JSON.stringify({ roomNumber, residentId, action: 'assign' }),
    });
  },

  // Remove resident from room
  async removeResident(roomNumber: string, residentId: number): Promise<ApiResponse> {
    return apiCall('rooms.php', {
      method: 'POST',
      body: JSON.stringify({ roomNumber, residentId, action: 'remove' }),
    });
  },
};

// Staff Assignments API (Toewijzingen)
export const staffAssignmentsApi = {
  // Get all assignments
  async getAll(date?: string): Promise<ApiResponse> {
    const endpoint = date ? `staff-assignments.php?date=${date}` : 'staff-assignments.php';
    return apiCall(endpoint);
  },

  // Create or update assignment
  async upsert(assignment: {
    residentId: number;
    staffName: string;
    assignmentType?: string;
    colorCode?: string;
    position?: { row: number; col: number };
  }): Promise<ApiResponse> {
    return apiCall('staff-assignments.php', {
      method: 'POST',
      body: JSON.stringify(assignment),
    });
  },

  // Delete assignment
  async delete(id: number): Promise<ApiResponse> {
    return apiCall(`staff-assignments.php?id=${id}`, {
      method: 'DELETE',
    });
  },
};

// Meal Schedules API (Keukenlijst)
export const mealSchedulesApi = {
  // Get meal schedule for a date
  async getByDate(date: string): Promise<ApiResponse> {
    return apiCall(`meal-schedules.php?date=${date}`);
  },

  // Update meal attendance
  async updateAttendance(
    residentId: number,
    date: string,
    mealType: string,
    isPresent: boolean
  ): Promise<ApiResponse> {
    return apiCall('meal-schedules.php', {
      method: 'POST',
      body: JSON.stringify({ residentId, date, mealType, isPresent }),
    });
  },
};

// Permissions API (Permissielijst)
export const permissionsApi = {
  // Get all permissions
  async getAll(status?: string): Promise<ApiResponse> {
    const endpoint = status ? `permissions.php?status=${status}` : 'permissions.php';
    return apiCall(endpoint);
  },

  // Create permission request
  async create(permission: {
    residentId: number;
    permissionType: string;
    startDate: string;
    endDate?: string;
    reason?: string;
  }): Promise<ApiResponse> {
    return apiCall('permissions.php', {
      method: 'POST',
      body: JSON.stringify(permission),
    });
  },

  // Update permission status
  async updateStatus(
    id: number,
    status: 'approved' | 'denied',
    approvedBy: string
  ): Promise<ApiResponse> {
    return apiCall(`permissions.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, approvedBy }),
    });
  },
};

// Documents API
export const documentsApi = {
  // Upload document
  async upload(formData: FormData): Promise<ApiResponse> {
    return apiCall('documents.php', {
      method: 'POST',
      headers: {
        // Don't set Content-Type, let browser set it with boundary for multipart
      },
      body: formData,
    });
  },

  // Get documents for resident
  async getByResident(residentId: number): Promise<ApiResponse> {
    return apiCall(`documents.php?resident_id=${residentId}`);
  },

  // Delete document
  async delete(id: number): Promise<ApiResponse> {
    return apiCall(`documents.php?id=${id}`, {
      method: 'DELETE',
    });
  },
};

// Resident Photos API
export const residentPhotosApi = {
  // Upload resident photo
  async upload(badgeNumber: number, imageFile: File): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('photo', imageFile);
    formData.append('badge_number', badgeNumber.toString());
    formData.append('type', 'resident_photo');
    
    return apiCall('?endpoint=resident-photos', {
      method: 'POST',
      // Don't set headers at all - let apiCall handle it properly for FormData
      body: formData,
    });
  },

  // Get resident photo URL
  async getByBadge(badgeNumber: number): Promise<ApiResponse<{photoUrl: string}>> {
    return apiCall<{photoUrl: string}>(`?endpoint=resident-photos&badge_number=${badgeNumber}`);
  },

  // Get all resident photos
  async getAll(): Promise<ApiResponse<{[badgeNumber: string]: string}>> {
    return apiCall<{[badgeNumber: string]: string}>('?endpoint=resident-photos');
  },

  // Delete resident photo
  async delete(badgeNumber: number): Promise<ApiResponse> {
    return apiCall(`?endpoint=resident-photos&badge_number=${badgeNumber}`, {
      method: 'DELETE',
    });
  },
};

// Activity Log API
export const activityLogApi = {
  // Get recent activities
  async getRecent(limit: number = 50): Promise<ApiResponse> {
    return apiCall(`activity-log.php?limit=${limit}`);
  },

  // Log activity
  async log(activity: {
    action: string;
    entityType: string;
    entityId?: number;
    details?: any;
  }): Promise<ApiResponse> {
    return apiCall('activity-log.php', {
      method: 'POST',
      body: JSON.stringify(activity),
    });
  },
};

// Settings API
export const settingsApi = {
  // Get all settings
  async getAll(): Promise<ApiResponse> {
    return apiCall('settings.php');
  },

  // Get specific setting
  async get(key: string): Promise<ApiResponse> {
    return apiCall(`settings.php?key=${key}`);
  },

  // Update setting
  async update(key: string, value: any): Promise<ApiResponse> {
    return apiCall('settings.php', {
      method: 'PUT',
      body: JSON.stringify({ key, value }),
    });
  },
};

// Database operations wrapper (for compatibility with existing code)
export const dbOperations = {
  // Add single resident
  async addResident(resident: ResidentData): Promise<ApiResponse<ResidentData>> {
    const result = await residentsApi.create(resident);
    if (result.success) {
      await activityLogApi.log({
        action: 'create',
        entityType: 'resident',
        entityId: result.data?.id,
        details: { badge: resident.badge, name: `${resident.firstName} ${resident.lastName}` },
      });
    }
    return result;
  },

  // Add multiple residents
  async addMultipleResidents(residents: ResidentData[]): Promise<ApiResponse<ResidentData>[]> {
    const results: ApiResponse<ResidentData>[] = [];
    
    // Process in batches to avoid overwhelming the server
    const batchSize = 10;
    for (let i = 0; i < residents.length; i += batchSize) {
      const batch = residents.slice(i, i + batchSize);
      const promises = batch.map(resident => this.addResident(resident));
      const batchResults = await Promise.all(promises);
      results.push(...batchResults);
    }
    
    return results;
  },

  // Update resident
  async updateResident(id: number, updates: Partial<ResidentData>): Promise<ApiResponse<ResidentData>> {
    const result = await residentsApi.update(id, updates);
    if (result.success) {
      await activityLogApi.log({
        action: 'update',
        entityType: 'resident',
        entityId: id,
        details: updates,
      });
    }
    return result;
  },

  // Delete resident
  async deleteResident(id: number): Promise<ApiResponse> {
    const result = await residentsApi.delete(id);
    if (result.success) {
      await activityLogApi.log({
        action: 'delete',
        entityType: 'resident',
        entityId: id,
      });
    }
    return result;
  },

  // Get all residents
  async getAllResidents(): Promise<ResidentData[]> {
    const result = await residentsApi.getAll();
    return result.success && result.data ? result.data : [];
  },
};

// Test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/test-connection.php`, {
      headers: {
        'X-Api-Key': API_KEY,
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Database connection successful:', data);
      return true;
    } else {
      console.error('❌ Database connection failed:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Database connection error:', error);
    return false;
  }
}

export default {
  residents: residentsApi,
  rooms: roomsApi,
  staffAssignments: staffAssignmentsApi,
  mealSchedules: mealSchedulesApi,
  permissions: permissionsApi,
  documents: documentsApi,
  residentPhotos: residentPhotosApi,
  activityLog: activityLogApi,
  settings: settingsApi,
  db: dbOperations,
  testConnection: testDatabaseConnection,
};