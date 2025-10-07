import { getPolkadotApi } from "../polkadot";
import { supabase } from "../supabase";
import { AccountId, H256 } from '@polkadot/types/interfaces';
import { Compact, u32, Option } from '@polkadot/types';
import { Vec, Tuple } from '@polkadot/types';

const CACHE_TTL_SECONDS = 60; // Cache for 60 seconds

interface ReferendumInfo {
  referendumIndex: number;
  info: any;
}

interface DaoData {
  referendumCount: number;
  proposals: FormattedProposal[];
  referenda: ReferendumInfo[];
  treasuryBalance: string | undefined;
  proposalCount: string;
}

interface FormattedProposal {
  index: number;
  hash: string;
  proposer: string | Record<string, any> | undefined;
  summary: string;
  fullDetails: string;
}

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

    // --- REFERENDA ---
    const refCount = await api.query.referenda.referendumCount();
    const total = Number(refCount.toString());

    const start = total > 10 ? total - 10 : 0;
    const referenda: ReferendumInfo[] = [];

    for (let i = start; i < total; i++) {
      const infoOpt = await api.query.referenda.referendumInfoFor(i);
      const info = (infoOpt as Option<any>).isSome ? (infoOpt as Option<any>).unwrap().toHuman() : "Inactive or missing";

      referenda.push({
        referendumIndex: i,
        info: info,
      });
    }

    // --- TREASURY ---
    let treasuryBalance: string | undefined;

    try {
      if (api.query.treasury.account) {
        // Newer runtime
        const account = await api.query.treasury.account();
        treasuryBalance = (account as any).toHuman();
      } else if (api.query.treasury.pot) {
        // Legacy runtime
        const pot = await api.query.treasury.pot();
        treasuryBalance = (pot as any).toHuman();
      } else {
        treasuryBalance = "Treasury balance query not supported on this runtime";
      }
    } catch {
      treasuryBalance = "Error fetching treasury balance";
    }

    const proposalCount = await api.query.treasury.proposalCount();

    // Fetch ongoing democracy proposals (using referenda for now as democracy pallet might not be available)
    // We will use a placeholder for `formattedProposals` as the original democracy proposals are not available
    const formattedProposals: FormattedProposal[] = []; // Initialize as empty or with placeholder data

    const daoData: DaoData = {
      referendumCount: total,
      proposals: formattedProposals,
      referenda: referenda,
      treasuryBalance: treasuryBalance,
      proposalCount: proposalCount.toString(),
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
