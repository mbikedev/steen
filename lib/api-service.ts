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

// Whitelist of fields that the PHP backend accepts for resident updates
const RESIDENT_UPDATE_ALLOWED_FIELDS: Array<keyof ResidentData> = [
  'badge',
  'firstName',
  'lastName',
  'room',
  'nationality',
  'ovNumber',
  'registerNumber',
  'dateOfBirth',
  'age',
  'gender',
  'referencePerson',
  'dateIn',
  'daysOfStay',
  'status',
  'remarks',
  'roomRemarks',
];

function filterResidentUpdates(updates: Partial<ResidentData>): Partial<ResidentData> {
  const filtered: Partial<ResidentData> = {};
  for (const key of RESIDENT_UPDATE_ALLOWED_FIELDS) {
    if (key in updates) {
      // @ts-expect-error index access
      filtered[key] = updates[key];
    }
  }
  return filtered;
}

// Helper function for API calls
async function apiCall<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const headers: Record<string, string> = {
      'X-Api-Key': API_KEY,
      ...(options.headers as Record<string, string> | undefined),
    };

    // Only set Content-Type to application/json if no Content-Type is specified
    // and the body is not FormData (which needs multipart/form-data)
    if (!options.headers || !(options.headers as any)['Content-Type']) {
      if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }
    }

    // Handle URL construction properly
    let url = API_BASE_URL;
    if (endpoint) {
      // If API_BASE_URL already ends with index.php, don't add a slash
      if (API_BASE_URL.endsWith('.php')) {
        url = `${API_BASE_URL}${endpoint}`;
      } else {
        url = `${API_BASE_URL}/${endpoint}`;
      }
    }
    
    console.log('🌐 API Call URL:', url);
    console.log('📤 Request Method:', options.method || 'GET');
    if (options.body) {
      console.log('📨 Request Body:', options.body);
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // Try to get error details from response
      let errorMessage = `HTTP ${response.status}`;
      let errorPayload: any = undefined;
      
      // Clone the response so we can read it multiple times if needed
      const responseClone = response.clone();
      
      try {
        const errorData = await response.json();
        errorPayload = errorData;
        errorMessage = errorData.error || errorData.message || errorMessage;
        console.error('🚨 API Error Details:', errorData);
      } catch (e) {
        // Response might not be JSON, try reading as text
        try {
          const errorText = await responseClone.text();
          if (errorText && errorText.trim() !== '') {
            console.error('🚨 API Error Response:', errorText);
            // Only use error text if it's not HTML (like error pages)
            if (!errorText.includes('<!DOCTYPE') && !errorText.includes('<html')) {
              errorMessage = errorText;
            }
          } else {
            console.warn('⚠️ Empty error response from server');
            // Provide more context based on status code
            if (response.status === 404) {
              errorMessage = 'API endpoint not found. The server endpoint may not be deployed.';
            } else if (response.status === 500) {
              errorMessage = 'Server error. Please try again later.';
            } else if (response.status === 403) {
              errorMessage = 'Access forbidden. Check API permissions.';
            }
          }
        } catch (textError) {
          console.error('🚨 Could not read error response:', textError);
        }
      }
      // Do not throw; return a consistent ApiResponse so callers can handle gracefully
      return {
        success: false,
        error: errorMessage,
        // Include payload if any for debugging callers
        data: errorPayload,
      } as ApiResponse<any>;
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
      // Can't read the text since body is already consumed
      console.log('Response headers:', {
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length'),
        status: response.status
      });
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

// OUT Residents API
export const outResidentsApi = {
  // Get all OUT residents
  async getAll(): Promise<ApiResponse<ResidentData[]>> {
    return apiCall<ResidentData[]>('?endpoint=out-residents');
  },

  // Get single OUT resident
  async getById(id: number): Promise<ApiResponse<ResidentData>> {
    return apiCall<ResidentData>(`?endpoint=out-residents&id=${id}`);
  },

  // Move resident from main table to OUT table
  async moveToOut(residentId: number): Promise<ApiResponse<ResidentData>> {
    console.log('🚀 Calling moveToOut API with residentId:', residentId);
    const result = await apiCall<ResidentData>('?endpoint=out-residents', {
      method: 'POST',
      body: JSON.stringify({ residentId }),
    });
    console.log('📦 moveToOut API response:', result);
    return result;
  },

  // Delete OUT resident permanently
  async delete(id: number): Promise<ApiResponse> {
    return apiCall(`?endpoint=out-residents&id=${id}`, {
      method: 'DELETE',
    });
  },
};

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
    const filtered = filterResidentUpdates(updates);
    if (Object.keys(filtered).length === 0) {
      // Avoid making a failing API call when there are no server-accepted fields
      return { success: false, error: 'No fields to update' };
    }
    return apiCall<ResidentData>(`?endpoint=residents&id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(filtered),
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
  // Get all assignments for a specific date
  async getAll(date?: string): Promise<ApiResponse> {
    const endpoint = date 
      ? `?endpoint=staff-assignments&date=${date}` 
      : '?endpoint=staff-assignments';
    return apiCall(endpoint);
  },

  // Create new assignment
  async create(assignment: {
    resident_id: number;
    staff_name: string;
    assignment_date: string;
    assignment_type?: string;
    color_code?: string;
    position_row?: number;
    position_col?: number;
    notes?: string;
  }): Promise<ApiResponse> {
    return apiCall('?endpoint=staff-assignments', {
      method: 'POST',
      body: JSON.stringify(assignment),
    });
  },

  // Update existing assignment
  async update(id: number, updates: {
    staff_name?: string;
    assignment_date?: string;
    assignment_type?: string;
    color_code?: string;
    position_row?: number;
    position_col?: number;
    notes?: string;
    status?: string;
  }): Promise<ApiResponse> {
    return apiCall('?endpoint=staff-assignments', {
      method: 'PUT',
      body: JSON.stringify({ id, ...updates }),
    });
  },

  // Delete assignment (soft delete)
  async delete(id: number): Promise<ApiResponse> {
    return apiCall(`?endpoint=staff-assignments&id=${id}`, {
      method: 'DELETE',
    });
  },

  // Bulk save assignments from table data
  async saveBulk(tableData: Array<Array<{text: string; color: string; type: string}>>, 
                 assignmentDate: string, 
                 staffNames: string[]): Promise<ApiResponse> {
    const assignments: any[] = [];
    
    // Convert table data to assignment records
    tableData.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell.text.trim() && colIndex < staffNames.length) {
          // Try to find resident by name
          const residentName = cell.text.trim();
          
          assignments.push({
            resident_name: residentName,
            staff_name: staffNames[colIndex],
            assignment_date: assignmentDate,
            assignment_type: cell.color === 'red' ? 'meerderjarig' : 
                           cell.color === 'blue' ? 'transfer' : 'regular',
            color_code: cell.color,
            position_row: rowIndex,
            position_col: colIndex,
            notes: cell.type
          });
        }
      });
    });

    return apiCall('?endpoint=staff-assignments', {
      method: 'POST',
      body: JSON.stringify({ 
        action: 'bulk_save',
        assignments: assignments 
      }),
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
  outResidents: outResidentsApi,
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