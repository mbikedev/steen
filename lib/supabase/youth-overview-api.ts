import { createClient } from './client';
import type { Database } from './database.types';

type YouthOverviewRow = Database['public']['Tables']['youth_overview']['Row'];
type YouthOverviewInsert = Database['public']['Tables']['youth_overview']['Insert'];
type YouthOverviewUpdate = Database['public']['Tables']['youth_overview']['Update'];

export interface YouthOverviewData {
  badge: string;
  naam?: string | null;
  voornaam?: string | null;
  geboortedatum?: string | null;
  leeftijd?: string | null;
  todos?: string | null;
  aandachtspunten?: string | null;
  datum_in?: string | null;
  intake?: string | null;
  referent?: string | null;
  gb?: string | null;
  nb?: string | null;
  back_up?: string | null;
  hr?: string | null;
  procedure?: string | null;
  voogd?: string | null;
  advocaat?: string | null;
  twijfel?: string | null;
  uitnodiging?: string | null;
  test?: string | null;
  resultaat?: string | null;
  opvolging_door?: string | null;
  betekening?: string | null;
  wijziging_match_it?: string | null;
  scan_dv?: string | null;
  versie?: string | null;
  voorlopige_versie_klaar?: string | null;
  voorlopige_versie_verzonden?: string | null;
  definitieve_versie?: string | null;
  procedureles?: string | null;
  og?: string | null;
  mdo?: string | null;
  mdo2?: string | null;
  bxl_uitstap?: string | null;
  context?: string | null;
  opbouw_context?: string | null;
  specificaties?: string | null;
  stavaza?: string | null;
  autonomie?: string | null;
  context2?: string | null;
  medisch?: string | null;
  pleegzorg?: string | null;
  aanmelding_nodig?: string | null;
  vist_adoc?: string | null;
  datum_transfer?: string | null;
  transferdossier_verzonden?: string | null;
  out_status?: string | null;
  tab_location?: string | null;
}

// Fetch all youth overview records
export async function fetchYouthOverviewData(tabLocation?: 'IN' | 'OUT'): Promise<YouthOverviewRow[]> {
  const supabase = createClient();

  let query = supabase.from('youth_overview').select('*');

  if (tabLocation) {
    query = query.eq('tab_location', tabLocation);
  }

  const { data, error } = await query.order('badge', { ascending: true });

  if (error) {
    console.error('Error fetching youth overview data:', error);
    return [];
  }

  return data || [];
}

// Fetch a single youth overview record by badge
export async function fetchYouthOverviewByBadge(badge: string): Promise<YouthOverviewRow | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('youth_overview')
    .select('*')
    .eq('badge', badge)
    .single();

  if (error) {
    console.error('Error fetching youth overview by badge:', error);
    return null;
  }

  return data;
}

// Update a specific field for a youth record
export async function updateYouthOverviewField(
  badge: string,
  field: keyof YouthOverviewData,
  value: any
): Promise<boolean> {
  const supabase = createClient();

  const updateData: any = {};
  updateData[field] = value;

  const { error } = await supabase
    .from('youth_overview')
    .update(updateData)
    .eq('badge', badge);

  if (error) {
    console.error('Error updating youth overview field:', error);
    return false;
  }

  return true;
}

// Batch update multiple fields for a youth record
export async function updateYouthOverviewRecord(
  badge: string,
  updates: Partial<YouthOverviewData>
): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from('youth_overview')
    .update(updates as YouthOverviewUpdate)
    .eq('badge', badge);

  if (error) {
    console.error('Error updating youth overview record:', error);
    return false;
  }

  return true;
}

// Create or update a youth overview record (upsert)
export async function upsertYouthOverviewRecord(
  data: YouthOverviewData
): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from('youth_overview')
    .upsert(data as YouthOverviewInsert, {
      onConflict: 'badge'
    });

  if (error) {
    console.error('Error upserting youth overview record:', error);
    return false;
  }

  return true;
}

// Batch upsert multiple youth overview records
export async function batchUpsertYouthOverviewRecords(
  records: YouthOverviewData[]
): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from('youth_overview')
    .upsert(records as YouthOverviewInsert[], {
      onConflict: 'badge'
    });

  if (error) {
    console.error('Error batch upserting youth overview records:', error);
    return false;
  }

  return true;
}

// Move a youth record between IN and OUT tabs
export async function moveYouthToTab(
  badge: string,
  tab: 'IN' | 'OUT',
  additionalData?: Partial<YouthOverviewData>
): Promise<boolean> {
  const supabase = createClient();

  const updateData: any = {
    tab_location: tab,
    ...additionalData
  };

  if (tab === 'OUT' && !additionalData?.datum_transfer) {
    updateData.datum_transfer = new Date().toISOString().split('T')[0];
  }

  const { error } = await supabase
    .from('youth_overview')
    .update(updateData)
    .eq('badge', badge);

  if (error) {
    console.error('Error moving youth to tab:', error);
    return false;
  }

  return true;
}

// Delete a youth overview record (soft delete by moving to OUT with a flag)
export async function deleteYouthOverviewRecord(badge: string): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from('youth_overview')
    .delete()
    .eq('badge', badge);

  if (error) {
    console.error('Error deleting youth overview record:', error);
    return false;
  }

  return true;
}

// Sync data from residents table to youth_overview
export async function syncFromResidentsTable(): Promise<boolean> {
  const supabase = createClient();

  // Fetch all residents
  const { data: residents, error: residentsError } = await supabase
    .from('residents')
    .select('*');

  if (residentsError) {
    console.error('Error fetching residents:', residentsError);
    return false;
  }

  if (!residents || residents.length === 0) {
    return true;
  }

  // Transform residents data to youth_overview format
  const youthRecords: YouthOverviewData[] = residents.map(resident => ({
    badge: resident.badge.toString(),
    naam: resident.last_name,
    voornaam: resident.first_name,
    geboortedatum: resident.date_of_birth,
    leeftijd: resident.age?.toString() || null,
    datum_in: resident.date_in,
    referent: resident.reference_person,
    tab_location: resident.date_out ? 'OUT' : 'IN',
    datum_transfer: resident.date_out,
  }));

  // Batch upsert the records
  const success = await batchUpsertYouthOverviewRecords(youthRecords);

  return success;
}

// Get age verification results
export async function getAgeVerificationResults(): Promise<Array<{badge: string, resultaat: string}>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('youth_overview')
    .select('badge, resultaat')
    .not('resultaat', 'is', null)
    .in('resultaat', ['Meerderjarig', 'Minderjarig']);

  if (error) {
    console.error('Error fetching age verification results:', error);
    return [];
  }

  return data || [];
}