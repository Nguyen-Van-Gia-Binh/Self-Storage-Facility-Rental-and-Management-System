import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchPolicyVersions } from '../pricing';
import { apiClient } from '../client';

vi.mock('../client', () => ({
  apiClient: vi.fn(),
}));

describe('fetchPolicyVersions API mapping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps publishedBy and retains rawPolicy snapshot from API response', async () => {
    const mockContent = [
      {
        id: 10,
        versionNo: 2,
        effectiveFrom: '2026-11-01T00:00:00+07:00',
        publishedBy: 4,
        depositMultiplier: 2,
      },
      {
        id: 9,
        versionNo: 1,
        effectiveFrom: '2026-01-01T00:00:00+07:00',
        publishedBy: 1,
        depositMultiplier: 1,
      },
    ];

    vi.mocked(apiClient).mockResolvedValue({ content: mockContent });

    const versions = await fetchPolicyVersions();
    expect(versions).toHaveLength(2);
    expect(versions[0].versionNo).toBe(2);
    expect(versions[0].publishedBy).toBe(4);
    expect(versions[0].rawPolicy).toEqual(mockContent[0]);
  });
});
