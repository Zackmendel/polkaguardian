import { getPolkadotApi } from "../polkadot";
import { supabase } from "../supabase";

const CACHE_TTL_SECONDS = 60; // Cache for 60 seconds

export async function GET(request: Request) {
  try {
    // Try to fetch from cache first
    const { data: cachedData } = await supabase
      .from("monitoring_data")
      .select("data, timestamp")
      .single();

    if (cachedData && (Date.now() - new Date(cachedData.timestamp).getTime()) / 1000 < CACHE_TTL_SECONDS) {
      return Response.json(cachedData.data);
    }

    const api = await getPolkadotApi();

    // Fetch connected peers count as a proxy for network health
    // const peers = await api.rpc.system.peers(); // Temporarily disabled due to RPC restrictions

    // Fetch chain name and node name
    const chain = await api.rpc.system.chain();
    const nodeName = await api.rpc.system.name();
    const nodeVersion = await api.rpc.system.version();

    const monitoringData = {
      chain: chain.toHuman(),
      nodeName: nodeName.toHuman(),
      nodeVersion: nodeVersion.toHuman(),
      // Placeholder for validator uptime and parachain performance
      validatorUptime: "N/A",
      parachainPerformance: "N/A",
      xcmTransfers: "N/A",
    };

    // Store in cache
    await supabase.from("monitoring_data").upsert(
      {
        id: 1, // Using a fixed ID for single monitoring data entry
        data: monitoringData,
        timestamp: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    return Response.json(monitoringData);
  } catch (error) {
    console.error("Error fetching monitoring data:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch monitoring data" }), { status: 500 });
  }
}
