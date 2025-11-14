// src/api/marketing.ts
import { supabase } from '../supabaseClient';

export const getMarketingCampaigns = async () => {
  const { data, error } = await supabase.from('marketing_campaigns').select('*');
  if (error) throw error;
  return data;
};

export const createMarketingCampaign = async (campaign: { name: string; content: string }) => {
  const { data, error } = await supabase.from('marketing_campaigns').insert([campaign]);
  if (error) throw error;
  return data;
};

export const updateMarketingCampaign = async (id: number, updates: { name?: string; content?: string }) => {
  const { data, error } = await supabase.from('marketing_campaigns').update(updates).match({ id });
  if (error) throw error;
  return data;
};

export const deleteMarketingCampaign = async (id: number) => {
  const { data, error } = await supabase.from('marketing_campaigns').delete().match({ id });
  if (error) throw error;
  return data;
};
