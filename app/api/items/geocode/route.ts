import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();

    if (!address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 });
    }

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

    if (!data.length) {
      return NextResponse.json({ error: "No results found" }, { status: 404 });
    }

    return NextResponse.json({
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
        displayName: data[0].display_name
    }, { status: 200 });

  } catch (error) {
    console.error("Geocoding API error:", error);
    return NextResponse.json({ error: "Failed to geocode address" }, { status: 500 });
  }
}
