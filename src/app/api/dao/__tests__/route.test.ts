import { GET } from '@/app/api/dao/route';

// Mock @polkadot/api
jest.mock('../../polkadot', () => ({
  getPolkadotApi: jest.fn(() =>
    Promise.resolve({
      query: {
        democracy: {
          publicProps: jest.fn(() =>
            Promise.resolve([ // Mocking a single proposal
              [
                { toNumber: () => 0 } as any,
                { toHex: () => '0x123abc' } as any,
                { toHuman: () => 'Proposer1' } as any,
              ],
            ])
          ),
          referendumCount: jest.fn(() => Promise.resolve({ toNumber: () => 1 } as any)),
        },
      },
    })
  ),
}));

// Mock Supabase
jest.mock('../../supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => ({ data: null })), // No cached data by default
      })),
      upsert: jest.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  },
}));

describe('DAO API Route', () => {
  test('should return DAO data', async () => {
    const request = new Request('http://localhost/api/dao');
    const response = await GET(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.referendumCount).toBe(1);
    expect(json.proposals).toHaveLength(1);
    expect(json.proposals[0].proposer).toBe('Proposer1');
  });

  test('should return 500 if an error occurs', async () => {
    // Temporarily modify the mock to simulate an error
    require('../../polkadot').getPolkadotApi.mockImplementationOnce(() => Promise.reject(new Error('API error')));

    const request = new Request('http://localhost/api/dao');
    const response = await GET(request);
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe('Failed to fetch DAO data');
  });
});
