import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const geocodeRequestSchema = z.object({
  address: z.string().trim().min(1, "Address is required").max(500),
});

const geocodeResponseSchema = z.array(
  z.object({
    lat: z.coerce.number().refine(Number.isFinite, "Invalid latitude"),
    lon: z.coerce.number().refine(Number.isFinite, "Invalid longitude"),
    display_name: z.string(),
  }),
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = geocodeRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Address is required", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { address } = parsed.data;

    const geocodeReqUrl = new URL("https://nominatim.openstreetmap.org/search");
    geocodeReqUrl.searchParams.set("q", address);
    geocodeReqUrl.searchParams.set("format", "json");
    geocodeReqUrl.searchParams.set("limit", "1");

    const response = await fetch(geocodeReqUrl.toString(), {
        headers: {
            'User-Agent': 'mind-application'
        }
    });
    
    if (!response.ok) {
        throw new Error("Failed to fetch geocoding data");
    }

    const data = await response.json();
    const parsedResponse = geocodeResponseSchema.safeParse(data);

    if (!parsedResponse.success) {
      return NextResponse.json({ error: "Unexpected geocoding response format" }, { status: 502 });
    }

    if (!parsedResponse.data.length) {
      return NextResponse.json({ error: "No results found" }, { status: 404 });
    }

    const [firstResult] = parsedResponse.data;

    return NextResponse.json({
        latitude: firstResult.lat,
        longitude: firstResult.lon,
        displayName: firstResult.display_name
    }, { status: 200 });

  } catch (error: unknown) {
    console.error("Geocoding API error:", error);
    return NextResponse.json({ error: "Failed to geocode address" }, { status: 500 });
  }
}
