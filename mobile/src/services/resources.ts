import { getJson } from "./api";
import { isManualOffline } from "./connectivity";
import { DEMO_RESOURCES } from "../data/demoResources";
import { LifelineResource, ResourceCategory } from "../types";

export async function fetchResources(
  category?: ResourceCategory | "all"
): Promise<{
  resources: LifelineResource[];
  isLive: boolean;
  error?: string;
}> {
  const manualOffline = await isManualOffline();
  if (manualOffline) {
    const filtered =
      !category || category === "all"
        ? DEMO_RESOURCES
        : DEMO_RESOURCES.filter((r) => r.category === category);
    return {
      resources: filtered,
      isLive: false
    };
  }

  try {
    const endpoint =
      category && category !== "all"
        ? `/api/resources?category=${encodeURIComponent(category)}`
        : "/api/resources";
    const data = await getJson<LifelineResource[]>(endpoint, 5000);
    return {
      resources: data,
      isLive: true
    };
  } catch (error: any) {
    const filtered =
      !category || category === "all"
        ? DEMO_RESOURCES
        : DEMO_RESOURCES.filter((r) => r.category === category);
    return {
      resources: filtered,
      isLive: false,
      error: "Unable to sync live directory. Displaying offline demo records."
    };
  }
}
