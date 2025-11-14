// src/api/marketing.test.ts
import { getMarketingCampaigns, createMarketingCampaign, updateMarketingCampaign, deleteMarketingCampaign } from './marketing';
import { supabase } from '../supabaseClient';

jest.mock('../supabaseClient', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    match: jest.fn(),
  },
}));

describe('Marketing API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should get marketing campaigns', async () => {
    const mockData = [{ id: 1, name: 'Campaign 1', content: 'Content 1' }];
    (supabase.select as jest.Mock).mockResolvedValueOnce({ data: mockData, error: null });
    const data = await getMarketingCampaigns();
    expect(data).toEqual(mockData);
    expect(supabase.from).toHaveBeenCalledWith('marketing_campaigns');
    expect(supabase.select).toHaveBeenCalledWith('*');
  });

  it('should create a marketing campaign', async () => {
    const newCampaign = { name: 'New Campaign', content: 'New Content' };
    const mockData = [{ id: 2, ...newCampaign }];
    (supabase.insert as jest.Mock).mockResolvedValueOnce({ data: mockData, error: null });
    const data = await createMarketingCampaign(newCampaign);
    expect(data).toEqual(mockData);
    expect(supabase.from).toHaveBeenCalledWith('marketing_campaigns');
    expect(supabase.insert).toHaveBeenCalledWith([newCampaign]);
  });

  it('should update a marketing campaign', async () => {
    const updates = { name: 'Updated Campaign' };
    const mockData = [{ id: 1, ...updates }];
    (supabase.match as jest.Mock).mockResolvedValueOnce({ data: mockData, error: null });
    const data = await updateMarketingCampaign(1, updates);
    expect(data).toEqual(mockData);
    expect(supabase.from).toHaveBeenCalledWith('marketing_campaigns');
    expect(supabase.update).toHaveBeenCalledWith(updates);
    expect(supabase.match).toHaveBeenCalledWith({ id: 1 });
  });

  it('should delete a marketing campaign', async () => {
    const mockData = [{ id: 1 }];
    (supabase.match as jest.Mock).mockResolvedValueOnce({ data: mockData, error: null });

    const data = await deleteMarketingCampaign(1);

    expect(data).toEqual(mockData);
    expect(supabase.from).toHaveBeenCalledWith('marketing_campaigns');
    expect(supabase.delete).toHaveBeenCalled();
    expect(supabase.match).toHaveBeenCalledWith({ id: 1 });
  });
});
