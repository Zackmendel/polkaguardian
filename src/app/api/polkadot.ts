import { ApiPromise, WsProvider } from '@polkadot/api';

let api: ApiPromise | null = null;

export async function getPolkadotApi(): Promise<ApiPromise> {
  if (api) {
    return api;
  }

  const provider = new WsProvider('wss://rpc.polkadot.io');
  api = await ApiPromise.create({ provider });
  return api;
}
