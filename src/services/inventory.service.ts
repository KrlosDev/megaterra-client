import supabase from "./supabase"
import type { ProjectRecordStatus, SizeType } from "./projects.service"

export type InventoryStatus = "sold" | "available" | "under_contract"
export type UnitType = "apartment" | "house" | "deposit" | "parking"

/** The parent project context embedded with each unit (for unit/currency display). */
export type InventoryProject = {
  project_name: string
  currency: string | null
  size_type: SizeType | null
  record_status: ProjectRecordStatus
}

/** A row from public.inventory, with its parent project embedded. */
export type InventoryUnit = {
  id: string
  project_id: string
  unit: string
  unit_type: UnitType | null
  unit_floor: string | null
  unit_description: string | null
  unit_size: number | null
  price: number | null
  status: InventoryStatus
  created_at: string
  updated_at: string
  project: InventoryProject | null
}

/** Fields accepted when creating an inventory unit (server fills id/timestamps). */
export type NewInventoryUnit = {
  project_id: string
  unit: string
  unit_type: UnitType | null
  unit_floor: string | null
  unit_description: string | null
  unit_size: number | null
  price: number | null
  status: InventoryStatus
}

const INVENTORY_COLUMNS =
  "id, project_id, unit, unit_type, unit_floor, unit_description, unit_size, price, status, created_at, updated_at, project:projects(project_name, currency, size_type, record_status)"

export const inventoryService = {
  // List all inventory units, grouped by project then unit.
  // Readable by every authenticated user.
  list: async (): Promise<InventoryUnit[]> => {
    const { data, error } = await supabase
      .from("inventory")
      .select(INVENTORY_COLUMNS)
      .order("project_id", { ascending: true })
      .order("unit", { ascending: true })
    if (error) throw error
    return (data ?? []) as unknown as InventoryUnit[]
  },

  // Create a single inventory unit. Insert is allowed for any authenticated
  // user (admins + executives) by RLS.
  create: async (input: NewInventoryUnit): Promise<InventoryUnit> => {
    const { data, error } = await supabase
      .from("inventory")
      .insert(input)
      .select(INVENTORY_COLUMNS)
      .single()
    if (error) throw error
    return data as unknown as InventoryUnit
  },
}

export default inventoryService
