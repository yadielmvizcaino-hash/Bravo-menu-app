
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Business, PlanType } from '../types';

const BUSINESS_LIST_COLUMNS = 'id, name, type, province, municipality, logo_url, cover_photos, plan, plan_expires_at, is_visible, average_rating, ratings_count, cuisine_types, events(*)';

export const useBusinesses = () => {
  return useQuery({
    queryKey: ['businesses'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select(BUSINESS_LIST_COLUMNS)
        .eq('is_visible', true);

      if (error) throw error;

      return (data || []).map(biz => ({
        ...biz,
        isVisible: biz.is_visible ?? true,
        logoUrl: biz.logo_url,
        coverPhotos: biz.cover_photos ?? [],
        averageRating: biz.average_rating ?? 0,
        ratingsCount: biz.ratings_count ?? 0,
        planExpiresAt: biz.plan_expires_at,
        cuisineTypes: biz.cuisine_types ?? [],
        events: (biz.events || []).map((e: any) => ({
          ...e,
          dateTime: e.dateTime ?? e.date_time,
          imageUrl: e.imageUrl ?? e.image_url,
          interestedCount: e.interestedCount ?? e.interested_count ?? 0
        })),
        stats: (biz as any).stats || { visits: 0, qrScans: 0, uniqueVisitors: 0 }
      } as any as Business));
    },
  });
};

export const useBusiness = (id: string | undefined) => {
  return useQuery({
    queryKey: ['business', id],
    queryFn: async () => {
      if (!id) return null;
      const { data: bizData, error: bizError } = await supabase
        .from('businesses')
        .select('*, products(*), categories(*), events(*), banners(*)')
        .eq('id', id)
        .single();

      if (bizError) throw bizError;

      return {
        ...bizData,
        isVisible: bizData.isVisible ?? bizData.is_visible ?? true,
        logoUrl: bizData.logoUrl ?? bizData.logo_url,
        coverPhotos: bizData.coverPhotos ?? bizData.cover_photos ?? [],
        averageRating: bizData.averageRating ?? bizData.average_rating ?? 0,
        ratingsCount: bizData.ratingsCount ?? bizData.ratings_count ?? 0,
        planExpiresAt: bizData.planExpiresAt ?? bizData.plan_expires_at,
        cuisineTypes: bizData.cuisineTypes ?? bizData.cuisine_types ?? [],
        deliveryEnabled: bizData.deliveryEnabled ?? bizData.delivery_enabled ?? false,
        deliveryPriceInside: bizData.deliveryPriceInside ?? bizData.delivery_price_inside ?? 0,
        deliveryPriceOutside: bizData.deliveryPriceOutside ?? bizData.delivery_price_outside ?? 0,
        products: (bizData.products || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          categoryId: p.categoryId ?? p.category_id,
          imageUrl: p.imageUrl ?? p.image_url,
          isVisible: p.isVisible ?? p.is_visible ?? true,
          isHighlighted: p.isHighlighted ?? p.is_highlighted ?? false
        })),
        categories: bizData.categories || [],
        events: (bizData.events || []).map((e: any) => ({
          ...e,
          dateTime: e.dateTime ?? e.date_time,
          imageUrl: e.imageUrl ?? e.image_url,
          interestedCount: e.interestedCount ?? e.interested_count ?? 0
        })),
        banners: (bizData.banners || []).map((b: any) => ({
          ...b,
          imageUrl: b.imageUrl ?? b.image_url,
          linkUrl: b.linkUrl ?? b.link_url
        })),
        leads: bizData.leads || [],
        stats: bizData.stats || { visits: 0, qrScans: 0, uniqueVisitors: 0 }
      } as Business;
    },
    enabled: !!id,
  });
};

export const useAllBusinesses = () => {
  return useQuery({
    queryKey: ['all-businesses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(b => ({
        ...b,
        isVisible: b.is_visible ?? true,
        logoUrl: b.logo_url,
        coverPhotos: b.cover_photos ?? [],
        planExpiresAt: b.plan_expires_at,
        stats: b.stats || { visits: 0, qrScans: 0, uniqueVisitors: 0 }
      } as any as Business));
    },
  });
};
