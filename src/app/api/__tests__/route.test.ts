import { GET } from '@/app/api/route';
import { ApiPromise } from '@polkadot/api';
import { WsProvider } from '@polkadot/rpc-provider';

// Mock @polkadot/api
jest.mock('../polkadot', () => ({
  getPolkadotApi: jest.fn(() =>
    Promise.resolve({
      query: {
        system: {
          account: jest.fn((address) => {
            if (address === 'valid-address') {
              return { data: { free: { toHuman: () => '10.00 KSM' }, reserved: { toHuman: () => '0 KSM' }, miscFrozen: { toHuman: () => '0 KSM' }, feeFrozen: { toHuman: () => '0 KSM' } } };
            }
            return { data: { free: { toHuman: () => '0 KSM' }, reserved: { toHuman: () => '0 KSM' }, miscFrozen: { toHuman: () => '0 KSM' }, feeFrozen: { toHuman: () => '0 KSM' } } };
          }),
        },
      },
    })
  ),
}));

// Mock Supabase
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({ data: null })), // No cached data by default
        })),
      })),
      upsert: jest.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  },
}));

describe('Wallet API Route', () => {
  test('should return 400 if address is missing', async () => {
    const request = new Request('http://localhost/api');
    const response = await GET(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('Address is required');
  });

  test('should return wallet data for a valid address', async () => {
    const request = new Request('http://localhost/api?address=valid-address');
    const response = await GET(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.address).toBe('valid-address');
    expect(json.free).toBe('10.00 KSM');
  });

  test('should return 500 if an error occurs', async () => {
    // Temporarily modify the mock to simulate an error
    require('../polkadot').getPolkadotApi.mockImplementationOnce(() => Promise.reject(new Error('API error')));

    const request = new Request('http://localhost/api?address=any-address');
    const response = await GET(request);
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe('Failed to fetch wallet data');
  });
});
