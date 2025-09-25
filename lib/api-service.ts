import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import { executeWithResourceControl } from "@/lib/request-manager";

type Tables = Database["public"]["Tables"];
type Resident = Tables["residents"]["Row"];
type Room = Tables["rooms"]["Row"];
type Appointment = Tables["appointments"]["Row"];
type StaffAssignment = Tables["staff_assignments"]["Row"];
type Permission = Tables["permissions"]["Row"];
type Document = Tables["documents"]["Row"];
type MealSchedule = Tables["meal_schedules"]["Row"];
type RoomAssignment = Tables["room_assignments"]["Row"];
type AdministrativeDocument = Tables["administrative_documents"]["Row"];
type DocumentCategory = Tables["document_categories"]["Row"];
type ResidentStatusHistory = Tables["resident_status_history"]["Row"];

// Define GeneralDocument type manually since it's not in database.types yet
type GeneralDocument = {
  id: string;
  title: string;
  description?: string | null;
  file_url: string;
  file_name: string;
  file_size?: number | null;
  mime_type?: string | null;
  category?: string | null;
  tags?: string[] | null;
  uploaded_by?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

type StorageFileObject = {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: {
    size?: number;
    mimetype?: string;
  } | null;
  fullPath: string;
};

export class ApiService {
  private supabase = createClient() as any;

  // Residents
  async getResidents() {
    return executeWithResourceControl(
      async () => {
        const { data, error } = await this.supabase
          .from("residents")
          .select("*")
          .order("badge", { ascending: true });

        if (error) throw error;
        return data;
      },
      2,
      "fetch all residents",
    );
  }

  async getResident(id: number) {
    const { data, error } = await this.supabase
      .from("residents")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  }

  async createResident(
    resident: Omit<Resident, "id" | "created_at" | "updated_at">,
  ): Promise<Resident> {
    // Create a copy of resident data without language field if it might cause issues
    const residentData = { ...resident };

    try {
      const { data, error } = await this.supabase
        .from("residents")
        .insert(residentData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      // Check if it's a duplicate error (409 or unique constraint violation)
      const isDuplicate =
        error?.code === "23505" ||
        error?.message?.includes("duplicate") ||
        error?.message?.includes("409") ||
        error?.status === 409;

      if (isDuplicate) {
        // For duplicates, just log a simple warning
        console.warn(
          `⚠️ Resident with badge ${residentData.badge} already exists - will be skipped`,
        );
        throw error; // Still throw to be handled by the caller
      }

      // For other errors, log more details
      console.error("createResident unexpected error:", error);
      console.error("Error details:", {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        residentData: {
          badge: residentData.badge,
          first_name: residentData.first_name?.substring(0, 20) + "...",
          last_name: residentData.last_name?.substring(0, 20) + "...",
          room: residentData.room,
          room_length: residentData.room?.length,
        },
      });

      // If error mentions language column, try again without it
      if (error?.message?.includes("language")) {
        console.warn(
          "Language column not found, retrying without language field",
        );
        // Create a new object without the language field
        const residentPayload = { ...residentData };
        delete (residentPayload as any).language;

        console.log(
          "Retrying without language field, payload keys:",
          Object.keys(residentPayload),
        );

        const { data, error: retryError } = await this.supabase
          .from("residents")
          .insert(residentPayload)
          .select()
          .single();

        if (retryError) {
          console.error("Retry also failed:", retryError);
          throw retryError;
        }
        console.log("✅ createResident retry without language succeeded");
        return data;
      }

      // If error mentions column length, try truncating fields
      if (error?.code === "22001" || error?.message?.includes("too long")) {
        console.warn("Data too long error, attempting to truncate fields");

        // Truncate string fields that might be too long
        const truncatedData = {
          ...residentData,
          room: residentData.room?.trim().substring(0, 20) || "", // Original DB limit, trim whitespace
          first_name: residentData.first_name?.trim().substring(0, 100) || "", // Ensure names aren't too long
          last_name: residentData.last_name?.trim().substring(0, 100) || "",
          nationality: residentData.nationality?.trim().substring(0, 50) || "",
          ov_number: residentData.ov_number?.trim().substring(0, 50) || "",
          register_number:
            residentData.register_number?.trim().substring(0, 50) || "",
          reference_person:
            residentData.reference_person?.trim().substring(0, 200) || "",
          status: residentData.status?.trim().substring(0, 50) || "",
          remarks: residentData.remarks?.trim().substring(0, 500) || "",
          room_remarks:
            residentData.room_remarks?.trim().substring(0, 500) || "",
        };

        console.log("Retrying with truncated data:", {
          original_room_length: residentData.room?.length,
          truncated_room_length: truncatedData.room?.length,
          original_room: residentData.room,
          truncated_room: truncatedData.room,
          fields_truncated: {
            first_name:
              residentData.first_name?.length !==
              truncatedData.first_name?.length,
            last_name:
              residentData.last_name?.length !==
              truncatedData.last_name?.length,
            room: residentData.room?.length !== truncatedData.room?.length,
            nationality:
              residentData.nationality?.length !==
              truncatedData.nationality?.length,
            ov_number:
              residentData.ov_number?.length !==
              truncatedData.ov_number?.length,
          },
        });

        const { data, error: retryError } = await this.supabase
          .from("residents")
          .insert(truncatedData)
          .select()
          .single();

        if (retryError) {
          console.error("Truncation retry also failed:", retryError);
          throw retryError;
        }
        return data;
      }

      throw error;
    }
  }

  async updateResident(id: number, updates: Partial<Resident>) {
    // Validate input
    if (!id || typeof id !== "number" || id <= 0) {
      const error = new Error(`Invalid resident ID: ${id}`);
      console.error("❌ updateResident called with invalid ID:", id);
      throw error;
    }

    if (!updates || Object.keys(updates).length === 0) {
      console.warn("⚠️ updateResident called with no updates, skipping");
      // Return existing data without making a database call with resource control
      return executeWithResourceControl(
        async () => {
          const { data } = await this.supabase
            .from("residents")
            .select("*")
            .eq("id", id)
            .single();
          return data;
        },
        2,
        `fetch resident ${id}`,
      );
    }

    // Create a copy of updates and sanitize fields
    const updateData: Partial<Resident> = { ...updates };

    // Remove any undefined or null fields (typed keys to satisfy TS)
    Object.keys(updateData).forEach((key) => {
      const typedKey = key as keyof Partial<Resident>;
      if (updateData[typedKey] === undefined || updateData[typedKey] === null) {
        delete updateData[typedKey];
      }
    });

    // Log what we're updating for debugging
    console.log(
      `🔄 Updating resident ${id} with fields:`,
      Object.keys(updateData),
    );

    return executeWithResourceControl(
      async () => {
        try {
          // Log network connectivity check
          if (typeof window !== "undefined" && !window.navigator.onLine) {
            throw new Error("No internet connection detected");
          }

          const { data, error } = await this.supabase
            .from("residents")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

          if (error) throw error;
          return data;
        } catch (error: any) {
          // Properly serialize the error for logging
          const errorDetails = {
            message: error?.message || "Unknown error",
            code: error?.code || "UNKNOWN",
            details: error?.details || null,
            hint: error?.hint || null,
            residentId: id,
            updateData: {
              ...updateData,
              // Truncate long fields for logging
              room: updateData.room?.substring(0, 30),
              nationality: updateData.nationality?.substring(0, 30),
              ov_number: updateData.ov_number?.substring(0, 30),
              register_number: updateData.register_number?.substring(0, 30),
              reference_person: updateData.reference_person?.substring(0, 30),
            },
          };

          // Categorize the error
          let errorCategory = "DATABASE_ERROR";
          if (
            error?.message?.includes("fetch") ||
            (error?.name === "TypeError" &&
              error?.message?.includes("Failed to fetch"))
          ) {
            errorCategory = "NETWORK_ERROR";
            console.warn(
              "🌐 Network error detected - likely connectivity issue",
            );
          } else if (
            error?.code === "401" ||
            error?.message?.includes("auth")
          ) {
            errorCategory = "AUTH_ERROR";
            console.warn("🔐 Authentication error detected");
          }

          console.warn(
            `⚠️ updateResident ${errorCategory}:`,
            error?.message || "Unknown error",
          );
          console.error(
            "❌ Error details:",
            JSON.stringify(errorDetails, null, 2),
          );

          // Handle specific database errors with migrations not applied
          if (error?.message?.includes("language")) {
            console.warn(
              "🔧 Language column not found, retrying without language field",
            );
            delete updateData.language;
          } else if (
            error?.message?.includes("value too long") ||
            error?.code === "22001"
          ) {
            console.warn(
              "🔧 Data too long error detected, applying automatic truncation",
            );
            // Truncate fields that commonly exceed limits
            if (updateData.room && updateData.room.length > 20) {
              updateData.room = updateData.room.substring(0, 20);
            }
            if (updateData.ov_number && updateData.ov_number.length > 50) {
              updateData.ov_number = updateData.ov_number.substring(0, 50);
            }
            if (
              updateData.register_number &&
              updateData.register_number.length > 50
            ) {
              updateData.register_number = updateData.register_number.substring(
                0,
                50,
              );
            }
            if (
              updateData.reference_person &&
              updateData.reference_person.length > 200
            ) {
              updateData.reference_person =
                updateData.reference_person.substring(0, 200);
            }
            if (updateData.nationality && updateData.nationality.length > 100) {
              updateData.nationality = updateData.nationality.substring(0, 100);
            }
          } else if (errorCategory === "NETWORK_ERROR") {
            console.warn(
              "🔄 Network error detected, retrying once after delay...",
            );
            // Wait 1 second and retry once for network errors
            await new Promise((resolve) => setTimeout(resolve, 1000));

            try {
              const { data, error: retryError } = await this.supabase
                .from("residents")
                .update(updateData)
                .eq("id", id)
                .select()
                .single();

              if (retryError) {
                console.error(
                  "❌ Network retry also failed:",
                  retryError.message,
                );
                throw new Error(`Network error: ${retryError.message}`);
              }

              console.log("✅ Network retry succeeded");
              return data;
            } catch (retryError) {
              console.error("❌ Network retry failed:", retryError);
              throw new Error(`Network connectivity issue: ${error?.message}`);
            }
          } else {
            // For other errors, don't retry
            throw error;
          }

          try {
            console.log("🔄 Retrying updateResident with adjusted data:", {
              residentId: id,
              adjustedFields: Object.keys(updateData),
            });

            const { data, error: retryError } = await this.supabase
              .from("residents")
              .update(updateData)
              .eq("id", id)
              .select()
              .single();

            if (retryError) {
              console.error("❌ Retry also failed:", retryError);
              throw retryError;
            }

            console.log("✅ updateResident retry succeeded");
            return data;
          } catch (retryError) {
            console.error("❌ Final retry failed, giving up:", retryError);
            throw retryError;
          }
        }
      },
      3,
      `update resident ${id}`,
    ); // High priority for updates
  }

  async deleteResident(id: number) {
    const { error } = await this.supabase
      .from("residents")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }

  // Rooms
  async getRooms() {
    const { data, error } = await this.supabase
      .from("rooms")
      .select("*")
      .order("building", { ascending: true })
      .order("floor", { ascending: true })
      .order("room_number", { ascending: true });

    if (error) throw error;
    return data;
  }

  async getRoom(id: number) {
    const { data, error } = await this.supabase
      .from("rooms")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  }

  async updateRoom(id: number, updates: Partial<Room>) {
    const { data, error } = await this.supabase
      .from("rooms")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Room Assignments
  async getRoomAssignments(roomId?: number, residentId?: number) {
    let query = this.supabase.from("room_assignments").select(`
        *,
        resident:residents(*),
        room:rooms(*)
      `);

    if (roomId) {
      query = query.eq("room_id", roomId);
    }

    if (residentId) {
      query = query.eq("resident_id", residentId);
    }

    query = query.eq("status", "active");

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  async createRoomAssignment(
    assignment: Omit<RoomAssignment, "id" | "created_at" | "updated_at">,
  ) {
    const { data, error } = await this.supabase
      .from("room_assignments")
      .insert(assignment)
      .select()
      .single();

    if (error) throw error;

    // Update room occupancy
    await this.updateRoomOccupancy(assignment.room_id);

    return data;
  }

  async releaseRoomAssignment(id: number) {
    const { data: assignment, error: getError } = await this.supabase
      .from("room_assignments")
      .select("room_id")
      .eq("id", id)
      .single();

    if (getError) throw getError;

    const { error } = await this.supabase
      .from("room_assignments")
      .update({
        status: "inactive",
        released_date: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;

    // Update room occupancy
    if (assignment) {
      await this.updateRoomOccupancy(assignment.room_id);
    }
  }

  private async updateRoomOccupancy(roomId: number) {
    const { data: assignments, error: countError } = await this.supabase
      .from("room_assignments")
      .select("id")
      .eq("room_id", roomId)
      .eq("status", "active");

    if (countError) throw countError;

    const occupied = assignments?.length || 0;

    const { error: updateError } = await this.supabase
      .from("rooms")
      .update({ occupied })
      .eq("id", roomId);

    if (updateError) throw updateError;
  }

  // Appointments
  async getAppointments(residentId?: number, date?: string) {
    let query = this.supabase.from("appointments").select(`
        *,
        resident:residents(*)
      `);

    if (residentId) {
      query = query.eq("resident_id", residentId);
    }

    if (date) {
      query = query.eq("appointment_date", date);
    }

    const { data, error } = await query.order("appointment_date", {
      ascending: true,
    });

    if (error) throw error;
    return data;
  }

  async createAppointment(
    appointment: Omit<Appointment, "id" | "created_at" | "updated_at">,
  ): Promise<Appointment> {
    const { data, error } = await this.supabase
      .from("appointments")
      .insert(appointment)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateAppointment(id: number, updates: Partial<Appointment>) {
    const { data, error } = await this.supabase
      .from("appointments")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteAppointment(id: number) {
    const { error } = await this.supabase
      .from("appointments")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }

  // Staff Assignments
  async getStaffAssignments(date?: string) {
    let query = this.supabase.from("staff_assignments").select("*");

    if (date) {
      query = query.eq("assignment_date", date);
    }

    const { data, error } = await query.order("assignment_date", {
      ascending: false,
    });

    if (error) throw error;
    return data;
  }

  async createStaffAssignment(
    assignment: Omit<StaffAssignment, "id" | "created_at" | "updated_at">,
  ) {
    const { data, error } = await this.supabase
      .from("staff_assignments")
      .insert(assignment)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateStaffAssignment(id: number, updates: Partial<StaffAssignment>) {
    const { data, error } = await this.supabase
      .from("staff_assignments")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteStaffAssignments(date: string) {
    const { error } = await this.supabase
      .from("staff_assignments")
      .delete()
      .eq("assignment_date", date);

    if (error) throw error;
  }

  async bulkCreateStaffAssignments(assignments: any[]) {
    // Check authentication first
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    console.log("🔐 Authentication check:", {
      user: user ? user.email : "No user",
    });

    const results = await Promise.all(
      assignments.map(async (assignment, index) => {
        try {
          const result = await this.createStaffAssignment(assignment);
          console.log(`✅ Saved assignment ${index + 1}:`, result);
          return result;
        } catch (err) {
          console.error(`❌ Failed to save assignment ${index + 1}:`, err);
          return { error: err };
        }
      }),
    );

    return results;
  }

  // Permissions
  async getPermissions(residentId?: number) {
    let query = this.supabase.from("permissions").select(`
        *,
        resident:residents(*)
      `);

    if (residentId) {
      query = query.eq("resident_id", residentId);
    }

    const { data, error } = await query.order("start_date", {
      ascending: false,
    });

    if (error) throw error;
    return data;
  }

  async createPermission(
    permission: Omit<Permission, "id" | "created_at" | "updated_at">,
  ) {
    const { data, error } = await this.supabase
      .from("permissions")
      .insert(permission)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updatePermission(id: number, updates: any) {
    const { data, error } = await this.supabase
      .from("permissions")
      .update(updates as any)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Meal Schedules
  async getMealSchedules(date: string) {
    const { data, error } = await this.supabase
      .from("meal_schedules")
      .select(
        `
        *,
        resident:residents(*)
      `,
      )
      .eq("meal_date", date);

    if (error) throw error;
    return data;
  }

  async createOrUpdateMealSchedule(
    schedule: Omit<MealSchedule, "id" | "created_at" | "updated_at">,
  ) {
    const { data, error } = await this.supabase
      .from("meal_schedules")
      .insert(schedule as any)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Documents
  async getDocuments(residentId?: number) {
    let query = this.supabase.from("documents").select("*");

    if (residentId) {
      query = query.eq("resident_id", residentId);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;
    return data;
  }

  async uploadDocument(
    file: File,
    metadata: {
      resident_id?: number;
      document_type: string;
      uploaded_by?: string;
    },
  ): Promise<Document> {
    // Upload file to Supabase Storage
    const fileName = `${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await this.supabase.storage
      .from("documents")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const {
      data: { publicUrl },
    } = this.supabase.storage.from("documents").getPublicUrl(fileName);

    // Create document record
    const { data, error } = await this.supabase
      .from("documents")
      .insert({
        ...metadata,
        document_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        mime_type: file.type,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteDocument(id: number) {
    // Get document to find file URL
    const { data: doc, error: getError } = await this.supabase
      .from("documents")
      .select("file_url")
      .eq("id", id)
      .single();

    if (getError) throw getError;

    // Extract file name from URL and delete from storage
    if (doc?.file_url) {
      const fileName = doc.file_url.split("/").pop();
      if (fileName) {
        await this.supabase.storage.from("documents").remove([fileName]);
      }
    }

    // Delete document record
    const { error } = await this.supabase
      .from("documents")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }

  // Dashboard Stats
  async getDashboardStats() {
    const [residents, rooms, recentActivities] = await Promise.all([
      this.supabase.from("residents").select("id, status"),
      this.supabase.from("rooms").select("id, occupied, capacity"),
      this.supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    if (residents.error) throw residents.error;
    if (rooms.error) throw rooms.error;

    // Count all residents regardless of status (since we want total count, not just active)
    const totalResidents = residents.data?.length || 0;
    const occupiedRooms =
      rooms.data?.filter((r: any) => r.occupied > 0).length || 0;
    const availableRooms =
      rooms.data?.filter((r: any) => r.occupied === 0).length || 0;
    const totalRooms = rooms.data?.length || 0;
    const totalCapacity =
      rooms.data?.reduce((sum: number, room: any) => sum + room.capacity, 0) ||
      0;
    const totalOccupied =
      rooms.data?.reduce((sum: number, room: any) => sum + room.occupied, 0) ||
      0;
    const occupancyRate =
      totalCapacity > 0 ? (totalOccupied / totalCapacity) * 100 : 0;

    return {
      totalResidents,
      occupiedRooms,
      availableRooms,
      totalRooms,
      occupancyRate: Math.round(occupancyRate),
      recentActivities: recentActivities.data || [],
    };
  }

  // Administrative Documents
  private async listStorageFiles(
    bucket: string,
    prefix: string,
  ): Promise<StorageFileObject[]> {
    const files: StorageFileObject[] = [];

    const walk = async (path: string) => {
      const trimmedPath = path.replace(/^\/+/, "").replace(/\/+$/, "");
      const listPath = trimmedPath.length > 0 ? trimmedPath : undefined;

      const { data, error } = await this.supabase.storage
        .from(bucket)
        .list(listPath, {
          limit: 1000,
          sortBy: { column: "name", order: "asc" },
        });

      if (error) {
        console.error("Failed to list Supabase storage path", {
          bucket,
          path: trimmedPath,
          error,
        });
        throw error;
      }

      if (!data) return;

      for (const item of data) {
        if (!item?.name || item.name === "." || item.name === "..") {
          continue;
        }

        const fullPath = trimmedPath
          ? `${trimmedPath}/${item.name}`
          : item.name;
        const isDirectory =
          !item.metadata || typeof item.metadata.size !== "number";

        if (isDirectory) {
          await walk(fullPath);
        } else {
          files.push({ ...item, fullPath });
        }
      }
    };

    await walk(prefix);
    return files;
  }

  private storageFileMatchesResident(
    file: StorageFileObject,
    badge: string,
    residentName?: { firstName?: string | null; lastName?: string | null },
  ): boolean {
    const normalizedBadge = String(badge || "").trim();
    if (!normalizedBadge) {
      return false;
    }

    const normalizeText = (value?: string | null) =>
      (value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "")
        .trim();

    const firstNameNormalized = normalizeText(residentName?.firstName);
    const lastNameNormalized = normalizeText(residentName?.lastName);
    const combinedName = firstNameNormalized + lastNameNormalized;
    const combinedNameReversed = lastNameNormalized + firstNameNormalized;

    const lowerBadge = normalizedBadge.toLowerCase();
    const badgeWithoutLeadingZeros = normalizedBadge.replace(/^0+/, "");
    const lowerBadgeNoZeros = badgeWithoutLeadingZeros.toLowerCase();
    const fullPathLower = file.fullPath.toLowerCase();
    const fileNameLower = file.name.toLowerCase();
    const digitsOnly = file.fullPath.replace(/[^0-9]/g, "");

    if (firstNameNormalized || lastNameNormalized) {
      const nameCandidates = [
        firstNameNormalized,
        lastNameNormalized,
        combinedName,
        combinedNameReversed,
      ].filter(Boolean) as string[];

      for (const candidate of nameCandidates) {
        if (
          candidate.length >= 3 &&
          fileNameLower.replace(/[^a-z0-9]/g, "").includes(candidate)
        ) {
          return true;
        }
      }
    }

    if (fullPathLower.includes(`/${lowerBadge}/`)) {
      return true;
    }

    if (
      fileNameLower.includes(lowerBadge) ||
      fullPathLower.includes(`_${lowerBadge}`) ||
      fullPathLower.includes(`-${lowerBadge}`) ||
      fullPathLower.includes(`${lowerBadge}_`) ||
      fullPathLower.includes(`${lowerBadge}-`)
    ) {
      return true;
    }

    if (lowerBadgeNoZeros && lowerBadgeNoZeros !== lowerBadge) {
      if (
        fileNameLower.includes(lowerBadgeNoZeros) ||
        fullPathLower.includes(`/${lowerBadgeNoZeros}/`) ||
        fullPathLower.includes(`_${lowerBadgeNoZeros}`) ||
        fullPathLower.includes(`-${lowerBadgeNoZeros}`)
      ) {
        return true;
      }
    }

    const pathSegments = fullPathLower.split("/");
    if (
      pathSegments.includes(lowerBadge) ||
      (lowerBadgeNoZeros && pathSegments.includes(lowerBadgeNoZeros))
    ) {
      return true;
    }

    const numericMatches = file.fullPath.match(/\d+/g) || [];
    if (
      numericMatches.some(
        (segment) =>
          segment === normalizedBadge || segment === badgeWithoutLeadingZeros,
      )
    ) {
      return true;
    }

    if (digitsOnly.includes(badgeWithoutLeadingZeros)) {
      return true;
    }

    if (normalizedBadge.length >= 3) {
      const lastThree = normalizedBadge.slice(-3);
      if (numericMatches.some((segment) => segment.slice(-3) === lastThree)) {
        return true;
      }
    }

    return false;
  }
  private extractStoragePathFromPublicUrl(
    url: string | null | undefined,
  ): string | null {
    if (!url) return null;
    const match = url.match(/administrative-documents\/(.+)$/);
    if (match && match[1]) {
      return match[1];
    }
    return null;
  }

  async listAdministrativeDocumentFiles(
    documentType: "IN" | "OUT" = "IN",
  ): Promise<StorageFileObject[]> {
    return this.listStorageFiles("administrative-documents", documentType);
  }

  async getAdministrativeDocuments(
    residentId?: number,
    documentType?: "IN" | "OUT",
  ) {
    let query = this.supabase
      .from("administrative_documents")
      .select("*")
      .order("created_at", { ascending: false });

    if (residentId) {
      query = query.eq("resident_id", residentId);
    }

    if (documentType) {
      query = query.eq("document_type", documentType);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Database error in getAdministrativeDocuments:", error);
      throw error;
    }
    return data || [];
  }

  async debugListAllDocuments() {
    try {
      console.log("🔍 Debugging storage bucket structure...");

      // List root
      const { data: rootData, error: rootError } = await this.supabase.storage
        .from("administrative-documents")
        .list("", {
          limit: 100,
        });

      if (rootError) {
        console.error("Error listing root:", rootError);
      } else {
        console.log("📁 Root contents:", rootData);
        if (rootData && rootData.length > 0) {
          console.log(
            "Root files/folders:",
            rootData.map((f: any) => f.name),
          );
        }
      }

      // List IN folder
      const { data: inData, error: inError } = await this.supabase.storage
        .from("administrative-documents")
        .list("IN", {
          limit: 200,
        });

      if (inError) {
        console.error("Error listing IN folder:", inError);
      } else {
        console.log("📁 IN folder contents:", inData);
        if (inData && inData.length > 0) {
          console.log("📄 First 10 files in IN folder:");
          inData.slice(0, 10).forEach((file: any) => {
            console.log(
              `  - ${file.name} (${file.metadata?.size || "size unknown"})`,
            );
          });

          // Extract badge patterns
          const badges = new Set();
          inData.forEach((file: any) => {
            // Try to extract badge number from filename
            const match = file.name.match(/(\d{4,6})/g);
            if (match) {
              match.forEach((m: any) => badges.add(m));
            }
          });
          console.log(
            "🔢 Unique badge numbers found in filenames:",
            Array.from(badges).slice(0, 20),
          );
        }
      }

      return { root: rootData, in: inData };
    } catch (error) {
      console.error("Debug error:", error);
      return null;
    }
  }

  async batchCreateDocumentRecords(
    residents: any[],
    documentPatterns: string[] = [
      "bijlage26.pdf",
      "toewijzing.pdf",
      "passport.pdf",
    ],
  ) {
    let created = 0;
    let skipped = 0;

    for (const resident of residents) {
      if (!resident.badge || !resident.id) continue;

      for (const pattern of documentPatterns) {
        // Create filename with badge
        const fileName = `${resident.badge}_${pattern}`;

        try {
          const result = await this.createDocumentRecord(
            resident.id,
            resident.badge,
            fileName,
            "IN",
          );
          if (result.success) {
            created++;
          } else {
            skipped++;
          }
        } catch (error) {
          console.error(
            `Error creating document for ${resident.badge}:`,
            error,
          );
        }
      }
    }

    return { created, skipped };
  }

  async createDocumentRecord(
    residentId: number | string,
    residentBadge: string | number,
    fileName: string,
    documentType: "IN" | "OUT" = "IN",
    options?: {
      storagePath?: string;
      fileSize?: number | null;
      mimeType?: string | null;
      description?: string | null;
      uploadedBy?: string | null;
      createdAt?: string | null;
      updatedAt?: string | null;
      residentName?: string | null;
    },
  ) {
    try {
      const badgeStr = String(residentBadge || "").trim();
      const storagePath = options?.storagePath ?? `${documentType}/${fileName}`;

      // Enhanced duplicate check - check both file_name and storage_path
      const { data: existing, error: existingError } = await this.supabase
        .from("administrative_documents")
        .select("id, file_name, storage_path")
        .eq("resident_id", residentId)
        .eq("document_type", documentType)
        .eq("file_name", fileName)
        .maybeSingle();

      if (existingError && existingError.code !== "PGRST116") {
        console.error(
          "Failed to check existing administrative document",
          existingError,
        );
        return { success: false, error: existingError };
      }

      if (existing) {
        console.log(
          `📝 Duplicate prevented: ${fileName} already exists for resident ${badgeStr}`,
        );

        // Update storage_path if it was missing
        if (options?.storagePath && !existing.storage_path) {
          await this.supabase
            .from("administrative_documents")
            .update({ storage_path: options.storagePath })
            .eq("id", existing.id);
          console.log(
            `✅ Updated storage_path for existing document ${fileName}`,
          );
        }

        return {
          success: false,
          message: "Duplicate prevented",
          isDuplicate: true,
        };
      }

      const { data: publicUrlData } = this.supabase.storage
        .from("administrative-documents")
        .getPublicUrl(storagePath);

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const publicUrl =
        publicUrlData?.publicUrl ??
        (supabaseUrl
          ? `${supabaseUrl}/storage/v1/object/public/administrative-documents/${storagePath}`
          : "");

      // Check if enhanced columns exist
      let hasEnhancedColumns = true;
      try {
        await this.supabase
          .from("administrative_documents")
          .select("resident_badge")
          .limit(1);
      } catch (testError: any) {
        if (testError?.code === "42703") {
          hasEnhancedColumns = false;
        }
      }

      const insertPayload: Record<string, any> = {
        resident_id: residentId,
        document_type: documentType,
        file_name: fileName,
        file_path: publicUrl,
        storage_path: storagePath, // Add storage_path for duplicate prevention
        file_size: options?.fileSize ?? null,
        mime_type: options?.mimeType ?? null,
        description: options?.description ?? null,
        uploaded_by: options?.uploadedBy ?? null,
      };

      // Only add enhanced fields if columns exist
      if (hasEnhancedColumns) {
        insertPayload.resident_badge = badgeStr;
        insertPayload.resident_name = options?.residentName ?? null;
      }

      if (options?.createdAt) {
        insertPayload.created_at = options.createdAt;
      }

      if (options?.updatedAt) {
        insertPayload.updated_at = options.updatedAt;
      }

      const { data, error } = await this.supabase
        .from("administrative_documents")
        .insert(insertPayload)
        .select()
        .maybeSingle();

      if (error) {
        console.error("Error creating document record:", error);
        console.error(
          "Insert payload was:",
          JSON.stringify(insertPayload, null, 2),
        );
        console.error("Error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        console.error("Full error object:", JSON.stringify(error, null, 2));
        return { success: false, error };
      }

      console.log(`✅ Created document record for ${fileName}`);
      return { success: true, data };
    } catch (error) {
      console.error("Error in createDocumentRecord:", error);
      return { success: false, error };
    }
  }

  async syncResidentDocuments(
    residentBadge: string | number,
    residentId: number | string,
    documentType: "IN" | "OUT" = "IN",
    options?: {
      storageFiles?: StorageFileObject[];
      residentName?: { firstName?: string | null; lastName?: string | null };
    },
  ) {
    try {
      const badgeStr = String(residentBadge || "").trim();
      if (!badgeStr) {
        console.warn(
          "syncResidentDocuments called without a valid badge number",
        );
        return { synced: 0, total: 0, skipped: 0, errors: [] };
      }

      const files =
        options?.storageFiles ??
        (await this.listAdministrativeDocumentFiles(documentType));

      if (!files || files.length === 0) {
        console.log(`No files found in ${documentType} folder`);
        return { synced: 0, total: 0, skipped: 0, errors: [] };
      }

      const matchedFiles = files.filter((file) =>
        this.storageFileMatchesResident(file, badgeStr, options?.residentName),
      );

      if (matchedFiles.length === 0) {
        console.log(`No matching files found for badge ${badgeStr}`);
        return { synced: 0, total: 0, skipped: 0, errors: [] };
      }

      let syncedCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];

      // Pre-fetch all existing documents for this resident to avoid multiple queries
      const { data: existingDocs } = await this.supabase
        .from("administrative_documents")
        .select("file_name, storage_path")
        .eq("resident_id", residentId)
        .eq("document_type", documentType);

      const existingFileNames = new Set(
        (existingDocs || []).map((d: any) => d.file_name),
      );
      const existingStoragePaths = new Set(
        (existingDocs || []).map((d: any) => d.storage_path).filter(Boolean),
      );

      // Check if enhanced columns exist once before processing files
      let hasEnhancedColumns = true;
      try {
        const { error: testError } = await this.supabase
          .from("administrative_documents")
          .select("resident_badge")
          .limit(1);

        if (testError?.code === "42703") {
          hasEnhancedColumns = false;
          console.log(
            "⚠️ Enhanced columns not yet available, using basic sync only",
          );
        }
      } catch (testError: any) {
        if (testError?.code === "42703") {
          hasEnhancedColumns = false;
          console.log(
            "⚠️ Enhanced columns not yet available, using basic sync only",
          );
        }
      }

      for (const file of matchedFiles) {
        try {
          const fileName = file.fullPath.split("/").pop() || file.name;
          const storagePath = file.fullPath;

          // Check if document already exists using our pre-fetched sets
          if (
            existingFileNames.has(fileName) ||
            existingStoragePaths.has(storagePath)
          ) {
            console.log(
              `📝 Document already exists for resident ${badgeStr}: ${fileName}`,
            );
            skippedCount++;
            continue;
          }

          // Enhanced check: Look for orphaned documents (only if enhanced columns exist)
          if (hasEnhancedColumns) {
            const { data: orphanedDoc, error: orphanError } =
              await this.supabase
                .from("administrative_documents")
                .select("id, resident_id, resident_badge, resident_name")
                .eq("document_type", documentType)
                .eq("file_name", fileName)
                .eq("resident_badge", badgeStr)
                .maybeSingle();

            if (!orphanError && orphanedDoc) {
              // Found an orphaned document - reassign it to current resident
              const { error: updateError } = await this.supabase
                .from("administrative_documents")
                .update({
                  resident_id: residentId,
                  resident_badge: badgeStr,
                  resident_name: options?.residentName
                    ? `${options.residentName.firstName || ""} ${options.residentName.lastName || ""}`.trim()
                    : null,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", orphanedDoc.id);

              if (!updateError) {
                console.log(
                  `✅ Reassigned orphaned document ${fileName} to resident ${badgeStr} (ID: ${residentId})`,
                );
                syncedCount++;
              } else {
                console.error(
                  `❌ Failed to reassign orphaned document ${fileName}:`,
                  updateError,
                );
                errors.push(
                  `Failed to reassign ${fileName}: ${updateError.message}`,
                );
              }
              continue;
            }
          }

          // Create new document record
          const result = await this.createDocumentRecord(
            residentId,
            badgeStr,
            fileName,
            documentType,
            {
              storagePath: file.fullPath,
              fileSize: file.metadata?.size ?? null,
              mimeType: file.metadata?.mimetype ?? null,
              uploadedBy: null, // Set to null for sync operations
              createdAt: file.created_at || null,
              updatedAt: file.updated_at || null,
              residentName: options?.residentName
                ? `${options.residentName.firstName || ""} ${options.residentName.lastName || ""}`.trim()
                : null,
            },
          );

          if (result.success) {
            syncedCount++;
          } else if (result.error) {
            const errorMsg = `Failed to create document record for ${fileName}`;
            console.error(errorMsg, result.error);
            errors.push(errorMsg);
          }
        } catch (docError) {
          const errorMsg = `Error processing storage file ${file.name}`;
          console.error(errorMsg + ":", docError);
          errors.push(errorMsg);
        }
      }

      console.log(
        `📄 Synced ${syncedCount} documents for resident ${badgeStr}`,
      );
      return {
        synced: syncedCount,
        total: matchedFiles.length,
        skipped: skippedCount,
        errors,
      };
    } catch (error) {
      console.error("Error in syncResidentDocuments:", error);
      return {
        synced: 0,
        total: 0,
        skipped: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  /**
   * Enhanced bulk synchronization that recovers orphaned documents
   * after data refreshes. Uses badge numbers and names to reconnect documents.
   */
  async recoverOrphanedDocuments(documentType: "IN" | "OUT" = "IN"): Promise<{
    recovered: number;
    updated: number;
    errors: string[];
  }> {
    const results = {
      recovered: 0,
      updated: 0,
      errors: [] as string[],
    };

    try {
      console.log(
        `🔄 Starting orphaned document recovery for ${documentType} documents...`,
      );

      // Get all current residents
      const { data: residents, error: residentsError } = await this.supabase
        .from("residents")
        .select("id, badge, first_name, last_name")
        .order("badge", { ascending: true });

      if (residentsError) {
        results.errors.push(
          `Failed to fetch residents: ${residentsError.message}`,
        );
        return results;
      }

      if (!residents || residents.length === 0) {
        results.errors.push("No residents found in database");
        return results;
      }

      // Check if enhanced columns exist
      let hasEnhancedColumns = true;
      try {
        await this.supabase
          .from("administrative_documents")
          .select("resident_badge")
          .limit(1);
      } catch (testError: any) {
        if (testError?.code === "42703") {
          hasEnhancedColumns = false;
          results.errors.push(
            "Enhanced columns (resident_badge, resident_name) do not exist. Please run database setup first.",
          );
          return results;
        }
      }

      // Get all orphaned documents (documents with non-existent resident_id or matching badge/name)
      const { data: orphanedDocs, error: orphanedError } = await this.supabase
        .from("administrative_documents")
        .select(
          "id, resident_id, resident_badge, resident_name, file_name, document_type",
        )
        .eq("document_type", documentType);

      if (orphanedError) {
        results.errors.push(
          `Failed to fetch documents: ${orphanedError.message}`,
        );
        return results;
      }

      if (!orphanedDocs || orphanedDocs.length === 0) {
        console.log(`No ${documentType} documents found to process`);
        return results;
      }

      console.log(
        `📄 Processing ${orphanedDocs.length} ${documentType} documents for recovery...`,
      );

      // Create lookup maps for efficient matching
      const residentsByBadge = new Map(
        residents.map((r: any) => [String(r.badge).trim(), r]),
      );
      const residentsByName = new Map();

      residents.forEach((r: any) => {
        const fullName = `${r.first_name || ""} ${r.last_name || ""}`
          .trim()
          .toLowerCase();
        if (fullName.length > 2) {
          residentsByName.set(fullName, r);
        }
      });

      // Process each document
      for (const doc of orphanedDocs) {
        try {
          let targetResident = null;

          // Check if resident_id still exists (may be valid)
          const existingResident = residents.find(
            (r: any) => r.id === doc.resident_id,
          );
          if (existingResident) {
            // Verify badge matches
            if (
              String(existingResident.badge).trim() ===
              String(doc.resident_badge || "").trim()
            ) {
              // Document is correctly linked, skip
              continue;
            }
          }

          // Try to find resident by badge number (most reliable)
          if (doc.resident_badge) {
            const badgeStr = String(doc.resident_badge).trim();
            targetResident = residentsByBadge.get(badgeStr);

            if (targetResident) {
              console.log(
                `🔗 Found resident by badge ${badgeStr} for document ${doc.file_name}`,
              );
            }
          }

          // If not found by badge, try by name
          if (!targetResident && doc.resident_name) {
            const nameStr = doc.resident_name.trim().toLowerCase();
            targetResident = residentsByName.get(nameStr);

            if (targetResident) {
              console.log(
                `🔗 Found resident by name "${nameStr}" for document ${doc.file_name}`,
              );
            } else {
              // Try partial name matching
              for (const [fullName, resident] of residentsByName.entries()) {
                if (fullName.includes(nameStr) || nameStr.includes(fullName)) {
                  targetResident = resident;
                  console.log(
                    `🔗 Found resident by partial name match "${fullName}" for document ${doc.file_name}`,
                  );
                  break;
                }
              }
            }
          }

          // Update document if target resident found
          if (targetResident) {
            const { error: updateError } = await this.supabase
              .from("administrative_documents")
              .update({
                resident_id: targetResident.id,
                resident_badge: String(targetResident.badge),
                resident_name:
                  `${targetResident.first_name || ""} ${targetResident.last_name || ""}`.trim(),
                updated_at: new Date().toISOString(),
              })
              .eq("id", doc.id);

            if (updateError) {
              results.errors.push(
                `Failed to update document ${doc.file_name}: ${updateError.message}`,
              );
            } else {
              if (doc.resident_id === targetResident.id) {
                results.updated++;
              } else {
                results.recovered++;
              }
              console.log(
                `✅ ${doc.resident_id === targetResident.id ? "Updated" : "Recovered"} document ${doc.file_name} for resident ${targetResident.badge}`,
              );
            }
          } else {
            console.log(
              `⚠️ No matching resident found for document ${doc.file_name} (badge: ${doc.resident_badge}, name: ${doc.resident_name})`,
            );
          }
        } catch (docError) {
          const errorMsg = `Error processing document ${doc.file_name}: ${docError instanceof Error ? docError.message : "Unknown error"}`;
          results.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      console.log(
        `🎉 Orphaned document recovery completed: ${results.recovered} recovered, ${results.updated} updated, ${results.errors.length} errors`,
      );
      return results;
    } catch (error) {
      const errorMsg = `Critical error in recoverOrphanedDocuments: ${error instanceof Error ? error.message : "Unknown error"}`;
      results.errors.push(errorMsg);
      console.error(errorMsg);
      return results;
    }
  }

  /**
   * Sync general documents that aren't tied to specific residents
   * This now syncs to the new general_documents table
   */
  async syncGeneralDocuments(documentType: "IN" | "OUT" = "IN"): Promise<{
    synced: number;
    total: number;
    errors: string[];
  }> {
    // Use the new syncStorageToGeneralDocuments method which syncs to the proper table
    const result = await this.syncStorageToGeneralDocuments();
    return {
      synced: result.synced,
      total: result.synced + result.skipped,
      errors: result.errors,
    };
  }

  /**
   * Legacy sync method for backwards compatibility
   * @deprecated Use syncStorageToGeneralDocuments instead
   */
  async syncGeneralDocumentsLegacy(documentType: "IN" | "OUT" = "IN"): Promise<{
    synced: number;
    total: number;
    errors: string[];
  }> {
    const results = { synced: 0, total: 0, errors: [] as string[] };

    try {
      console.log(`🗂️ Syncing general ${documentType} documents...`);

      // Get all files from storage
      const storageFiles =
        await this.listAdministrativeDocumentFiles(documentType);

      if (!storageFiles || storageFiles.length === 0) {
        console.log(`No files found in ${documentType} folder`);
        return results;
      }

      // Get all existing documents from database
      const { data: existingDocs, error: dbError } = await this.supabase
        .from("administrative_documents")
        .select("file_name")
        .eq("document_type", documentType);

      if (dbError) {
        results.errors.push(
          `Failed to fetch existing documents: ${dbError.message}`,
        );
        return results;
      }

      const existingFileNames = new Set(
        (existingDocs || []).map((doc: any) => doc.file_name),
      );

      // Process each file
      for (const file of storageFiles) {
        // Skip placeholder files
        if (
          file.name === ".emptyFolderPlaceholder" ||
          file.name.startsWith(".")
        ) {
          continue;
        }

        const fileName = file.fullPath.split("/").pop() || file.name;
        results.total++;

        // Check if document already exists
        if (existingFileNames.has(fileName)) {
          console.log(`📄 Document already exists: ${fileName}`);
          continue;
        }

        // Get public URL for the file
        const {
          data: { publicUrl },
        } = this.supabase.storage
          .from("administrative-documents")
          .getPublicUrl(file.fullPath);

        // Create document record as a general document (no resident_id)
        try {
          const { error: insertError } = await this.supabase
            .from("administrative_documents")
            .insert({
              file_name: fileName,
              file_path: publicUrl,
              document_type: documentType,
              file_size: file.metadata?.size || 0,
              mime_type: file.metadata?.mimetype || "application/octet-stream",
              description: `General ${documentType} document - ${fileName}`,
              // No resident_id - this is a general document
              resident_id: null,
              resident_badge: null,
              resident_name: null,
            });

          if (insertError) {
            console.error(
              `Failed to insert document ${fileName}:`,
              insertError,
            );
            results.errors.push(`${fileName}: ${insertError.message}`);
          } else {
            console.log(`✅ Synced general document: ${fileName}`);
            results.synced++;
          }
        } catch (error) {
          console.error(`Error syncing ${fileName}:`, error);
          results.errors.push(
            `${fileName}: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }

      console.log(
        `📊 General sync completed: ${results.synced}/${results.total} documents synced`,
      );
    } catch (error) {
      const errorMsg = `Critical error in syncGeneralDocuments: ${error instanceof Error ? error.message : "Unknown error"}`;
      results.errors.push(errorMsg);
      console.error(errorMsg);
    }

    return results;
  }

  /**
   * Smart sync that combines storage sync with orphan recovery and general documents
   */
  async smartSyncAllDocuments(documentType: "IN" | "OUT" = "IN"): Promise<{
    storageSync: { syncedDocs: number; residentsWithUpdates: number };
    orphanRecovery: { recovered: number; updated: number; errors: string[] };
    generalSync?: { synced: number; total: number; errors: string[] };
  }> {
    console.log(`🚀 Starting smart sync for ${documentType} documents...`);

    // First, recover orphaned documents
    const orphanRecovery = await this.recoverOrphanedDocuments(documentType);

    // Then, sync general documents (not tied to specific residents)
    const generalSync = await this.syncGeneralDocuments(documentType);

    // Finally, run normal resident-specific storage sync
    const storageSync = { syncedDocs: 0, residentsWithUpdates: 0 };

    try {
      const { data: residents, error: residentsError } = await this.supabase
        .from("residents")
        .select("id, badge, first_name, last_name")
        .order("badge", { ascending: true });

      if (residentsError) {
        console.error(
          "Failed to fetch residents for storage sync:",
          residentsError,
        );
        return { storageSync, orphanRecovery, generalSync };
      }

      const storageFiles =
        await this.listAdministrativeDocumentFiles(documentType);

      for (const resident of residents || []) {
        try {
          const { synced } = await this.syncResidentDocuments(
            resident.badge,
            resident.id,
            documentType,
            {
              storageFiles,
              residentName: {
                firstName: resident.first_name,
                lastName: resident.last_name,
              },
            },
          );

          if (synced > 0) {
            storageSync.syncedDocs += synced;
            storageSync.residentsWithUpdates += 1;
          }
        } catch (residentError) {
          console.error(
            `Failed to sync documents for resident ${resident.badge}:`,
            residentError,
          );
        }
      }
    } catch (error) {
      console.error("Error in storage sync phase:", error);
    }

    console.log(`✅ Smart sync completed:`);
    console.log(
      `  - General documents: ${generalSync.synced}/${generalSync.total} synced`,
    );
    console.log(
      `  - Resident documents: ${storageSync.syncedDocs} synced for ${storageSync.residentsWithUpdates} residents`,
    );
    console.log(
      `  - Orphan recovery: ${orphanRecovery.recovered} recovered, ${orphanRecovery.updated} updated`,
    );

    return { storageSync, orphanRecovery, generalSync };
  }

  // General Documents Methods
  async getGeneralDocuments(options?: {
    category?: string;
    tags?: string[];
    isActive?: boolean;
  }) {
    let query = this.supabase
      .from("general_documents")
      .select("*")
      .order("created_at", { ascending: false });

    if (options?.category) {
      query = query.eq("category", options.category);
    }

    if (options?.tags && options.tags.length > 0) {
      query = query.contains("tags", options.tags);
    }

    if (options?.isActive !== undefined) {
      query = query.eq("is_active", options.isActive);
    } else {
      // Default to only active documents
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching general documents:", error);
      throw error;
    }

    return data || [];
  }

  async createGeneralDocument(
    document: Omit<GeneralDocument, "id" | "created_at" | "updated_at">,
  ): Promise<GeneralDocument> {
    const { data, error } = await this.supabase
      .from("general_documents")
      .insert(document)
      .select()
      .single();

    if (error) {
      console.error("Error creating general document:", error);
      throw error;
    }

    return data;
  }

  async updateGeneralDocument(id: string, updates: Partial<GeneralDocument>) {
    const { data, error } = await this.supabase
      .from("general_documents")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating general document:", error);
      throw error;
    }

    return data;
  }

  async deleteGeneralDocument(id: string, softDelete = true) {
    if (softDelete) {
      // Soft delete - just mark as inactive
      return this.updateGeneralDocument(id, { is_active: false });
    } else {
      // Hard delete
      const { error } = await this.supabase
        .from("general_documents")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting general document:", error);
        throw error;
      }
    }
  }

  async uploadGeneralDocument(
    file: File,
    metadata: {
      title: string;
      description?: string;
      category?: string;
      tags?: string[];
      uploaded_by?: string;
    },
  ): Promise<GeneralDocument> {
    // Upload file to Supabase Storage with sanitized filename
    const sanitizedName = this.sanitizeFileName(file.name);
    const fileName = `general/${Date.now()}_${sanitizedName}`;

    const { data: uploadData, error: uploadError } = await this.supabase.storage
      .from("administrative-documents")
      .upload(fileName, file);

    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      throw uploadError;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = this.supabase.storage
      .from("administrative-documents")
      .getPublicUrl(fileName);

    // Create document record
    const document = await this.createGeneralDocument({
      title: metadata.title,
      description: metadata.description || null,
      file_url: publicUrl,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      category: metadata.category || null,
      tags: metadata.tags || null,
      uploaded_by: metadata.uploaded_by || null,
      is_active: true,
    });

    return document;
  }

  async syncStorageToGeneralDocuments(): Promise<{
    synced: number;
    skipped: number;
    errors: string[];
  }> {
    const results = { synced: 0, skipped: 0, errors: [] as string[] };

    try {
      console.log("🔄 Syncing storage files to general_documents table...");

      // Get all IN files from storage
      const storageFiles = await this.listAdministrativeDocumentFiles("IN");

      // Get existing general documents
      const existingDocs = await this.getGeneralDocuments();
      const existingFileNames = new Set(
        existingDocs.map((doc: any) => doc.file_name),
      );

      for (const file of storageFiles) {
        // Skip placeholder files
        if (
          file.name === ".emptyFolderPlaceholder" ||
          file.name.startsWith(".")
        ) {
          continue;
        }

        const fileName = file.fullPath.split("/").pop() || file.name;

        // Skip if already exists
        if (existingFileNames.has(fileName)) {
          results.skipped++;
          continue;
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = this.supabase.storage
          .from("administrative-documents")
          .getPublicUrl(file.fullPath);

        // Determine category based on filename
        let category = "general";
        const lowerName = fileName.toLowerCase();
        if (lowerName.includes("bijlage")) category = "form";
        else if (lowerName.includes("toewijzing")) category = "assignment";
        else if (lowerName.includes("specimen")) category = "template";
        else if (lowerName.includes("fiche")) category = "form";
        else if (lowerName.includes("verdwijning")) category = "notice";

        // Extract a readable title from filename
        let title = fileName
          .replace(/^\d+_/, "") // Remove timestamp prefix
          .replace(/\.[^.]+$/, "") // Remove extension
          .replace(/_/g, " ") // Replace underscores with spaces
          .replace(/\b\w/g, (l) => l.toUpperCase()); // Capitalize first letters

        try {
          await this.createGeneralDocument({
            title: title,
            description: `Imported from storage: ${fileName}`,
            file_url: publicUrl,
            file_name: fileName,
            file_size: file.metadata?.size || null,
            mime_type: file.metadata?.mimetype || "application/octet-stream",
            category: category,
            tags: [category, "imported"],
            uploaded_by: null,
            is_active: true,
          });

          console.log(`✅ Synced to general documents: ${fileName}`);
          results.synced++;
        } catch (error) {
          const errorMsg = `Failed to sync ${fileName}: ${error instanceof Error ? error.message : "Unknown error"}`;
          console.error(errorMsg);
          results.errors.push(errorMsg);
        }
      }

      console.log(
        `✅ General documents sync completed: ${results.synced} synced, ${results.skipped} skipped`,
      );
    } catch (error) {
      const errorMsg = `Critical error in syncStorageToGeneralDocuments: ${error instanceof Error ? error.message : "Unknown error"}`;
      console.error(errorMsg);
      results.errors.push(errorMsg);
    }

    return results;
  }

  private sanitizeFileName(fileName: string): string {
    // Replace special characters and normalize accented characters
    return fileName
      .normalize("NFD") // Decompose accented characters
      .replace(/[\u0300-\u036f]/g, "") // Remove diacritical marks
      .replace(/[^a-zA-Z0-9._-]/g, "_") // Replace invalid characters with underscore
      .replace(/_{2,}/g, "_") // Replace multiple underscores with single
      .replace(/^_+|_+$/g, ""); // Remove leading/trailing underscores
  }

  async uploadAdministrativeDocument(
    file: File,
    metadata: {
      resident_id?: number | string;
      document_type: "IN" | "OUT";
      description?: string;
      uploaded_by?: string;
    },
  ): Promise<AdministrativeDocument> {
    // Get current user ID for uploaded_by field
    const {
      data: { user },
    } = await this.supabase.auth.getUser();

    // Upload file to Supabase Storage with sanitized filename
    const sanitizedName = this.sanitizeFileName(file.name);
    const fileName = `${metadata.document_type}/${Date.now()}_${sanitizedName}`;
    const { data: uploadData, error: uploadError } = await this.supabase.storage
      .from("administrative-documents")
      .upload(fileName, file);

    if (uploadError) {
      if (uploadError.message?.includes("Bucket not found")) {
        throw new Error(
          'Storage bucket "administrative-documents" not found. Please create it in Supabase dashboard under Storage.',
        );
      }
      throw uploadError;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = this.supabase.storage
      .from("administrative-documents")
      .getPublicUrl(fileName);

    // Create document record
    const insertPayload = {
      resident_id: metadata.resident_id ? Number(metadata.resident_id) : null,
      document_type: metadata.document_type,
      description: metadata.description,
      uploaded_by: user?.id || metadata.uploaded_by || null,
      file_name: file.name,
      file_path: publicUrl,
      storage_path: fileName, // Add storage_path for duplicate prevention
      file_size: file.size,
      mime_type: file.type,
    };

    console.log(
      "📤 Attempting to insert document with payload:",
      JSON.stringify(insertPayload, null, 2),
    );

    const { data, error } = await this.supabase
      .from("administrative_documents")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error(
        "❌ Database insert error in uploadAdministrativeDocument:",
        error,
      );
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      console.error("Failed payload:", insertPayload);
      throw error;
    }

    console.log("✅ Document uploaded successfully:", data);
    return data;
  }

  async deleteAdministrativeDocument(id: number) {
    // Get document to find file path
    const { data: doc, error: getError } = await this.supabase
      .from("administrative_documents")
      .select("file_path")
      .eq("id", id)
      .maybeSingle();

    if (getError) throw getError;

    // Extract storage path from public URL and delete from storage
    const storagePath = this.extractStoragePathFromPublicUrl(doc?.file_path);
    if (storagePath) {
      await this.supabase.storage
        .from("administrative-documents")
        .remove([storagePath]);
    }

    // Delete document record
    const { error } = await this.supabase
      .from("administrative_documents")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }

  // Document Categories
  async getDocumentCategories(documentType?: "IN" | "OUT") {
    let query = this.supabase
      .from("document_categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (documentType) {
      query = query.eq("document_type", documentType);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async createDocumentCategory(
    category: Omit<DocumentCategory, "id" | "created_at" | "updated_at">,
  ) {
    const { data, error } = await this.supabase
      .from("document_categories")
      .insert(category)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Resident Status History
  async getResidentStatusHistory(
    residentId?: number,
    statusType?: "IN" | "OUT",
  ) {
    let query = this.supabase
      .from("resident_status_history")
      .select(
        `
        *,
        resident:residents(*)
      `,
      )
      .order("change_date", { ascending: false });

    if (residentId) {
      query = query.eq("resident_id", residentId);
    }

    if (statusType) {
      query = query.eq("status_type", statusType);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async createStatusHistoryEntry(
    entry: Omit<ResidentStatusHistory, "id" | "created_at">,
  ) {
    const { data, error } = await this.supabase
      .from("resident_status_history")
      .insert(entry)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Activity Logging - temporarily disabled to prevent resource exhaustion
  async logActivity(activity: {
    action: string;
    entity_type: string;
    entity_id?: number;
    details?: any;
    user_id?: string;
  }) {
    // Temporarily disabled to prevent ERR_INSUFFICIENT_RESOURCES
    console.log(
      "📝 Activity (not logged to DB):",
      activity.action,
      activity.entity_type,
    );
    return;

    /* Original implementation - re-enable when database issues are resolved
    const { error } = await this.supabase
      .from('activity_logs')
      .insert(activity)

    if (error) console.error('Failed to log activity:', error)
    */
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Staff assignments API
export const staffAssignmentsApi = {
  async saveBulk(
    tableData: any[][],
    assignmentDate: string,
    staffNames: string[],
  ) {
    console.log("⚠️ staffAssignmentsApi.saveBulk is deprecated");
    return {
      success: false,
      error: "Toewijzingen functionality has been removed",
    };
  },

  async getAll(assignmentDate: string) {
    try {
      const assignments = await apiService.getStaffAssignments(assignmentDate);
      return {
        success: true,
        data: {
          assignments: assignments || [],
        },
      };
    } catch (error) {
      console.error("Error in staffAssignmentsApi.getAll:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  async deleteAll(assignmentDate: string) {
    try {
      await apiService.deleteStaffAssignments(assignmentDate);
      return { success: true };
    } catch (error) {
      console.error("Error in staffAssignmentsApi.deleteAll:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

// Resident Photos API
export const residentPhotosApi = {
  getAll: async () => {
    try {
      const supabase = createClient() as any;

      // Get all photos from database
      const { data, error } = await supabase
        .from("resident_photos")
        .select("*");

      if (error) throw error;

      // Convert to object format expected by frontend
      const photosObject: Record<string, string> = {};
      if (data) {
        data.forEach((photo: any) => {
          photosObject[photo.badge_number] = photo.photo_url;
        });
      }

      return { success: true, data: photosObject };
    } catch (error) {
      console.error("Error fetching resident photos:", error);
      return { success: false, error: "Failed to fetch photos" };
    }
  },

  upload: async (badgeNumber: number, file: File) => {
    try {
      const supabase = createClient() as any;
      const badgeStr = badgeNumber.toString();

      // First check if photo already exists for this badge
      const { data: existingPhoto } = await supabase
        .from("resident_photos")
        .select("photo_url")
        .eq("badge_number", badgeStr)
        .maybeSingle();

      // If exists, delete old file from storage
      if (existingPhoto?.photo_url) {
        const oldPath = existingPhoto.photo_url.split("/").pop();
        if (oldPath) {
          await supabase.storage.from("resident-photos").remove([oldPath]);
        }
      }

      // Upload new file to storage
      const fileName = `${badgeStr}_${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("resident-photos")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("resident-photos").getPublicUrl(fileName);

      // Upsert photo record in database
      const { error: dbError } = await supabase.from("resident_photos").upsert(
        {
          badge_number: badgeStr,
          photo_url: publicUrl,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "badge_number",
        },
      );

      if (dbError) throw dbError;

      return { success: true, data: { photoUrl: publicUrl } };
    } catch (error) {
      console.error("Error uploading resident photo:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Photo upload failed",
      };
    }
  },

  delete: async (badgeNumber: number) => {
    try {
      const supabase = createClient() as any;
      const badgeStr = badgeNumber.toString();

      // Get photo URL first
      const { data: photo, error: fetchError } = await supabase
        .from("resident_photos")
        .select("photo_url")
        .eq("badge_number", badgeStr)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (photo?.photo_url) {
        // Extract file name from URL and delete from storage
        const fileName = photo.photo_url.split("/").pop();
        if (fileName) {
          await supabase.storage.from("resident-photos").remove([fileName]);
        }

        // Delete from database
        const { error: deleteError } = await supabase
          .from("resident_photos")
          .delete()
          .eq("badge_number", badgeStr);

        if (deleteError) throw deleteError;
      }

      return { success: true };
    } catch (error) {
      console.error("Error deleting resident photo:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Photo delete failed",
      };
    }
  },
};

// Weekend Permissions API
export const weekendPermissionsApi = {
  // Get permissions for a specific week
  getByWeek: async (week: string) => {
    try {
      const supabase = createClient() as any;
      const { data, error } = await supabase
        .from("weekend_permissions")
        .select("*")
        .eq("week", week)
        .order("badge");

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error("Error fetching weekend permissions:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch permissions",
      };
    }
  },

  // Save or update permissions for a specific week
  saveWeekPermissions: async (permissions: any[]) => {
    try {
      if (permissions.length === 0) {
        return { success: true, data: { saved: 0, errors: [] } };
      }

      const results = { saved: 0, errors: [] as any[] };

      for (const permission of permissions) {
        try {
          // Prepare the data for database
          const dbPermission = {
            resident_id: permission.residentId,
            badge: permission.badge,
            first_name: permission.firstName,
            last_name: permission.lastName,
            date_of_birth: permission.dateOfBirth,
            age: permission.age,
            week: permission.week,
            friday_type: permission.friday.type,
            saturday_type: permission.saturday.type,
            sunday_type: permission.sunday.type,
            monday_type: permission.monday?.type || null,
            notes: permission.notes || "",
            status: permission.status,
            actual_arrival_time: permission.actualArrivalTime || null,
            last_modified: permission.lastModified,
          };

          // Use upsert (insert or update) based on resident_id and week
          const supabase = createClient() as any;
          const { error } = await supabase
            .from("weekend_permissions")
            .upsert(dbPermission, {
              onConflict: "resident_id,week",
            });

          if (error) {
            console.error(
              `Error saving permission for resident ${permission.residentId}:`,
              error,
            );
            results.errors.push({
              residentId: permission.residentId,
              error: error.message,
            });
          } else {
            results.saved++;
          }
        } catch (error) {
          console.error(
            `Error processing permission for resident ${permission.residentId}:`,
            error,
          );
          results.errors.push({
            residentId: permission.residentId,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return { success: true, data: results };
    } catch (error) {
      console.error("Error saving weekend permissions:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to save permissions",
      };
    }
  },

  // Delete permissions for a specific week
  deleteWeekPermissions: async (week: string) => {
    try {
      const supabase = createClient() as any;
      const { error } = await supabase
        .from("weekend_permissions")
        .delete()
        .eq("week", week);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Error deleting weekend permissions:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete permissions",
      };
    }
  },

  // Get permissions for a specific resident
  getByResident: async (residentId: number) => {
    try {
      const supabase = createClient() as any;
      const { data, error } = await supabase
        .from("weekend_permissions")
        .select("*")
        .eq("resident_id", residentId)
        .order("week", { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error("Error fetching resident permissions:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch resident permissions",
      };
    }
  },

  // Update status of permissions (approve/reject)
  updatePermissionStatus: async (
    permissionIds: number[],
    status: "approved" | "rejected",
  ) => {
    try {
      const supabase = createClient() as any;
      const { error } = await supabase
        .from("weekend_permissions")
        .update({ status, last_modified: new Date().toISOString() })
        .in("id", permissionIds);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Error updating permission status:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update status",
      };
    }
  },
};
