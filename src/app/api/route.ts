import { getPolkadotApi } from "./polkadot";
import { supabase } from "./supabase";

const CACHE_TTL_SECONDS = 60; // Cache for 60 seconds

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return new Response(JSON.stringify({ error: "Address is required" }), { status: 400 });
  }

  try {
    // Try to fetch from cache first
    const { data: cachedData } = await supabase
      .from("wallet_data")
      .select("data, timestamp")
      .eq("address", address)
      .single();

    if (cachedData && (Date.now() - new Date(cachedData.timestamp).getTime()) / 1000 < CACHE_TTL_SECONDS) {
      return Response.json(cachedData.data);
    }

    const api = await getPolkadotApi();
    const { data: balance } = await api.query.system.account(address);

    const walletData = {
      address,
      free: balance.free.toHuman(),
      reserved: balance.reserved.toHuman(),
      miscFrozen: balance.miscFrozen?.toHuman() ?? '0 KSM',
      feeFrozen: balance.feeFrozen?.toHuman() ?? '0 KSM',
    };

    // Store in cache
    await supabase.from("wallet_data").upsert(
      {
        address,
        data: walletData,
        timestamp: new Date().toISOString(),
      },
      { onConflict: "address" }
    );

    return Response.json(walletData);
  } catch (error) {
    console.error("Error fetching wallet data:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch wallet data" }), { status: 500 });
  }
}
