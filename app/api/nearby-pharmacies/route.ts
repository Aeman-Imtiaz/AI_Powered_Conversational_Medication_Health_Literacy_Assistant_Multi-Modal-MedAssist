import { NextResponse } from "next/server";

const OVERPASS_SERVERS = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

type OverpassElement = {
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: {
    name?: string;
    addr_full?: string;
    "addr:street"?: string;
  };
};

type OverpassResponse = {
  elements?: OverpassElement[];
};

type Pharmacy = {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distanceKm: number;
  rating: number | null;
  openNow: boolean | null;
};

function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const lat = Number(searchParams.get("lat"));
    const lng = Number(searchParams.get("lng"));

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid location",
        },
        {
          status: 400,
        }
      );
    }

    const query = `
[out:json][timeout:30];

(
  node["amenity"="pharmacy"]
  (around:10000,${lat},${lng});

  way["amenity"="pharmacy"]
  (around:10000,${lat},${lng});


  node["shop"="chemist"]
  (around:10000,${lat},${lng});

  way["shop"="chemist"]
  (around:10000,${lat},${lng});
);

out center;
`;

    const fetchWithTimeout = async (server: string) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      try {
        const response = await fetch(
          `${server}?data=${encodeURIComponent(query)}`,
          {
            method: "GET",
            headers: { "User-Agent": "MedicineFinderApp/1.0" },
            cache: "no-store",
            signal: controller.signal,
          }
        );
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error("Bad response");
        return (await response.json()) as OverpassResponse;
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    };

    let result: OverpassResponse | null = null;

    try {
      // Saare servers ko ek sath try karein, jo pehle jawab de wahi use karein
      result = await Promise.any(OVERPASS_SERVERS.map(fetchWithTimeout));
    } catch {
      result = null;
    }

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: "All pharmacy servers are unavailable",
        },
        {
          status: 503,
        }
      );
    }

    const pharmacies: Pharmacy[] = (result.elements || [])
      .map((item): Pharmacy | null => {
        const plat = item.lat ?? item.center?.lat;
        const plng = item.lon ?? item.center?.lon;

        if (typeof plat !== "number" || typeof plng !== "number") {
          return null;
        }

        return {
          placeId: String(item.id),
          name: item.tags?.name || "Unnamed Pharmacy",
          address:
            item.tags?.addr_full ||
            item.tags?.["addr:street"] ||
            "Address unavailable",
          lat: plat,
          lng: plng,
          distanceKm: distanceKm(lat, lng, plat, plng),
          rating: null,
          openNow: null,
        };
      })
      .filter((item): item is Pharmacy => item !== null);

    pharmacies.sort((a, b) => a.distanceKm - b.distanceKm);

    return NextResponse.json({
      success: true,
      pharmacies: pharmacies.slice(0, 20),
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load pharmacies",
      },
      {
        status: 500,
      }
    );
  }
}