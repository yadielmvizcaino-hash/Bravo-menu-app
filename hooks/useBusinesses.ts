
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Business } from '../types';
import { getWithCache } from '../utils/cache';

const BUSINESS_LIST_COLUMNS = 'id, name, type, province, municipality, logo_url, cover_photos, is_visible, average_rating, ratings_count, product_types, events(*)';

export const useBusinesses = () => {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['businesses'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    queryFn: async () => {
      const fetcher = async () => {
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
          productTypes: biz.product_types ?? [],
          events: (biz.events || []).map((e: any) => ({
            ...e,
            dateTime: e.dateTime ?? e.date_time,
            imageUrl: e.imageUrl ?? e.image_url,
            interestedCount: e.interestedCount ?? e.interested_count ?? 0,
            clicks: e.clicks ?? 0
          })),
          stats: (biz as any).stats || { visits: 0, qrScans: 0, uniqueVisitors: 0 }
        } as any as Business));
      };

      return getWithCache('businesses-list', fetcher, (freshData) => {
        // Actualizar el caché de React Query cuando lleguen los datos frescos
        queryClient.setQueryData(['businesses'], freshData);
      });
    },
  });
};

export const useBusiness = (id: string | undefined) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['business', id],
    staleTime: 1000 * 60 * 2, // 2 minutes
    queryFn: async () => {
      if (!id) return null;

      const fetcher = async () => {
        const { data: bizData, error: bizError } = await supabase
          .from('businesses')
          .select('*, products(*), categories(*), events(*), banners(*)')
          .eq('id', id);

        if (bizError) throw bizError;
        if (!bizData || bizData.length === 0) return null;
        const business = bizData[0];

        return {
          ...business,
          isVisible: business.isVisible ?? business.is_visible ?? true,
          logoUrl: business.logoUrl ?? business.logo_url,
          coverPhotos: business.coverPhotos ?? business.cover_photos ?? [],
          averageRating: business.averageRating ?? business.average_rating ?? 0,
          ratingsCount: business.ratingsCount ?? business.ratings_count ?? 0,
          planExpiresAt: business.planExpiresAt ?? business.plan_expires_at,
          productTypes: business.productTypes ?? business.product_types ?? [],
          deliveryEnabled: business.deliveryEnabled ?? business.delivery_enabled ?? false,
          deliveryPriceInside: business.deliveryPriceInside ?? business.delivery_price_inside ?? 0,
          deliveryPriceOutside: business.deliveryPriceOutside ?? business.delivery_price_outside ?? 0,
          products: (business.products || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            categoryId: p.categoryId ?? p.category_id,
            imageUrl: p.imageUrl ?? p.image_url,
            isVisible: p.isVisible ?? p.is_visible ?? true,
            isHighlighted: p.isHighlighted ?? p.is_highlighted ?? false
          })),
          categories: business.categories || [],
          events: (business.events || []).map((e: any) => ({
            ...e,
            dateTime: e.dateTime ?? e.date_time,
            imageUrl: e.imageUrl ?? e.image_url,
            interestedCount: e.interestedCount ?? e.interested_count ?? 0,
            clicks: e.clicks ?? 0
          })),
          banners: (business.banners || []).map((b: any) => ({
            ...b,
            imageUrl: b.imageUrl ?? b.image_url,
            linkUrl: b.linkUrl ?? b.link_url,
            clicks: b.clicks ?? 0
          })),
          leads: business.leads || [],
          stats: business.stats || { visits: 0, qrScans: 0, uniqueVisitors: 0 }
        } as Business;
      };

      return getWithCache(`business-detail-${id}`, fetcher, (freshData) => {
        queryClient.setQueryData(['business', id], freshData);
      });
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
