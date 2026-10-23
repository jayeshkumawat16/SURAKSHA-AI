import { getDatabase, memoryStore } from "./database";
import { ChecklistItem } from "../types";

export const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: "chk-1", title: "Drinking water (minimum 3-day supply, 3L/person/day)", category: "survival", completed: false },
  { id: "chk-2", title: "Non-perishable ready-to-eat dry rations (3 days)", category: "survival", completed: false },
  { id: "chk-3", title: "Prescription medications & family first-aid kit", category: "medical", completed: false },
  { id: "chk-4", title: "Heavy-duty LED torch / flashlight with extra cells", category: "tools", completed: false },
  { id: "chk-5", title: "Charged power bank (10,000+ mAh) & cables", category: "tools", completed: false },
  { id: "chk-6", title: "Identity docs (Aadhaar, insurance) in sealed waterproof pouch", category: "documents", completed: false },
  { id: "chk-7", title: "Emergency signaling whistle", category: "tools", completed: false },
  { id: "chk-8", title: "Family emergency meeting point & paper contact card", category: "documents", completed: false },
  { id: "chk-9", title: "N95 / dust masks & hand sanitizer", category: "medical", completed: false },
  { id: "chk-10", title: "Sturdy boots, warm jacket & rain poncho", category: "survival", completed: false }
];

export async function getChecklistItems(): Promise<ChecklistItem[]> {
  const db = await getDatabase();
  if (db) {
    try {
      const rows = await db.getAllAsync<{
        id: string;
        title: string;
        category: string;
        completed: number;
        is_custom: number;
      }>("SELECT id, title, category, completed, is_custom FROM checklist_items;");

      if (rows && rows.length > 0) {
        return rows.map((r) => ({
          id: r.id,
          title: r.title,
          category: r.category as any,
          completed: r.completed === 1,
          isCustom: r.is_custom === 1
        }));
      }

      // Seed default items
      for (const item of DEFAULT_CHECKLIST) {
        await db.runAsync(
          "INSERT INTO checklist_items (id, title, category, completed, is_custom) VALUES (?, ?, ?, ?, ?);",
          [item.id, item.title, item.category, item.completed ? 1 : 0, item.isCustom ? 1 : 0]
        );
      }
      return DEFAULT_CHECKLIST;
    } catch (e) {
      console.warn("DB error in getChecklistItems:", e);
    }
  }

  // Memory fallback
  if (!memoryStore.checklist_items || Object.keys(memoryStore.checklist_items).length === 0) {
    DEFAULT_CHECKLIST.forEach((item) => {
      memoryStore.checklist_items[item.id] = { ...item };
    });
  }
  return Object.values(memoryStore.checklist_items);
}

export async function toggleChecklistItem(id: string, completed: boolean): Promise<void> {
  const db = await getDatabase();
  if (db) {
    try {
      await db.runAsync("UPDATE checklist_items SET completed = ? WHERE id = ?;", [
        completed ? 1 : 0,
        id
      ]);
      return;
    } catch (e) {
      console.warn("DB error in toggleChecklistItem:", e);
    }
  }

  if (memoryStore.checklist_items[id]) {
    memoryStore.checklist_items[id].completed = completed;
  }
}

export async function addCustomChecklistItem(title: string): Promise<ChecklistItem> {
  const newItem: ChecklistItem = {
    id: `chk-custom-${Date.now()}`,
    title,
    category: "custom",
    completed: false,
    isCustom: true
  };

  const db = await getDatabase();
  if (db) {
    try {
      await db.runAsync(
        "INSERT INTO checklist_items (id, title, category, completed, is_custom) VALUES (?, ?, ?, ?, ?);",
        [newItem.id, newItem.title, newItem.category, 0, 1]
      );
    } catch (e) {
      console.warn("DB error in addCustomChecklistItem:", e);
    }
  }

  memoryStore.checklist_items[newItem.id] = newItem;
  return newItem;
}

export async function saveLastSOSMessage(message: string): Promise<void> {
  const db = await getDatabase();
  if (db) {
    try {
      await db.runAsync(
        "INSERT OR REPLACE INTO cached_sos (id, message, updated_at) VALUES ('last_sos', ?, ?);",
        [message, new Date().toISOString()]
      );
      return;
    } catch (e) {
      console.warn("DB error in saveLastSOSMessage:", e);
    }
  }

  memoryStore.cached_sos["last_sos"] = { message, updated_at: new Date().toISOString() };
}

export async function getLastSOSMessage(): Promise<string> {
  const db = await getDatabase();
  if (db) {
    try {
      const row = await db.getFirstAsync<{ message: string }>(
        "SELECT message FROM cached_sos WHERE id = 'last_sos';"
      );
      if (row) return row.message;
    } catch (e) {
      console.warn("DB error in getLastSOSMessage:", e);
    }
  }

  return memoryStore.cached_sos["last_sos"]?.message || "";
}
