export async function calculateETA(origin: { lat: number, lng: number }, destination: string) {
    // In a real implementation, this would call the Google Distance Matrix API
    // Using a placeholder API KEY from env
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        console.warn("GOOGLE_MAPS_API_KEY not found. Returning mock ETA.");
        return { duration: "15 min", distance: "5.2 km" };
    }

    try {
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.lat},${origin.lng}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.rows?.[0]?.elements?.[0]?.status === "OK") {
            const element = data.rows[0].elements[0];
            return {
                duration: element.duration.text,
                distance: element.distance.text,
            };
        }
    } catch (error) {
        console.error("Error calculating ETA:", error);
    }

    return { duration: "N/A", distance: "N/A" };
}
