import { getDatabase, memoryStore } from "./database";
import { TrustedContact } from "../types";

export async function getAllContacts(): Promise<TrustedContact[]> {
  const db = await getDatabase();
  if (db) {
    try {
      const rows = await db.getAllAsync<TrustedContact>(
        "SELECT id, name, phone, relationship, created_at FROM trusted_contacts ORDER BY created_at DESC;"
      );
      return rows;
    } catch (e) {
      console.warn("DB read error in getAllContacts:", e);
    }
  }

  // Memory fallback
  return Object.values(memoryStore.trusted_contacts || {}) as TrustedContact[];
}

export async function saveContact(contact: TrustedContact): Promise<void> {
  const db = await getDatabase();
  if (db) {
    try {
      await db.runAsync(
        `INSERT OR REPLACE INTO trusted_contacts (id, name, phone, relationship, created_at)
         VALUES (?, ?, ?, ?, ?);`,
        [contact.id, contact.name, contact.phone, contact.relationship || "", contact.created_at]
      );
      return;
    } catch (e) {
      console.warn("DB write error in saveContact:", e);
    }
  }

  // Memory fallback
  memoryStore.trusted_contacts[contact.id] = contact;
}

export async function deleteContact(id: string): Promise<void> {
  const db = await getDatabase();
  if (db) {
    try {
      await db.runAsync("DELETE FROM trusted_contacts WHERE id = ?;", [id]);
      return;
    } catch (e) {
      console.warn("DB delete error in deleteContact:", e);
    }
  }

  delete memoryStore.trusted_contacts[id];
}

export async function clearAllContacts(): Promise<void> {
  const db = await getDatabase();
  if (db) {
    try {
      await db.runAsync("DELETE FROM trusted_contacts;");
      return;
    } catch (e) {
      console.warn("DB clear error in clearAllContacts:", e);
    }
  }

  memoryStore.trusted_contacts = {};
}
