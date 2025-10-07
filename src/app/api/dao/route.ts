import { getPolkadotApi } from "../polkadot";
import { supabase } from "../supabase";

const CACHE_TTL_SECONDS = 60; // Cache for 60 seconds

export async function GET() {
  try {
    // Try to fetch from cache first
    const { data: cachedData } = await supabase
      .from("dao_data")
      .select("data, timestamp")
      .single();

    if (cachedData && (Date.now() - new Date(cachedData.timestamp).getTime()) / 1000 < CACHE_TTL_SECONDS) {
      return Response.json(cachedData.data);
    }

    const api = await getPolkadotApi();

    // Check if the democracy pallet exists on the connected chain
    if (!api.query.democracy) {
      return new Response(JSON.stringify({ error: "Democracy pallet not available on this chain." }), { status: 404 });
    }

    // Fetch ongoing democracy proposals
    const proposals = await api.query.democracy.publicProps();
    const referendums = await api.query.democracy.referendumCount();

    const formattedProposals = proposals.map(([index, hash, proposer]) => ({
      index: index.toNumber(),
      hash: hash.toHex(),
      proposer: proposer.toHuman(),
    }));

    const daoData = {
      referendumCount: referendums.toNumber(),
      proposals: formattedProposals,
    };

    // Store in cache
    await supabase.from("dao_data").upsert(
      {
        id: 1, // Using a fixed ID for single DAO data entry
        data: daoData,
        timestamp: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    return Response.json(daoData);
  } catch (error) {
    console.error("Error fetching DAO data:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch DAO data" }), { status: 500 });
  }
}
