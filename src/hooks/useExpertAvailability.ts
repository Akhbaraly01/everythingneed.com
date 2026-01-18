import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ExpertAvailability {
  id: string;
  expert_id: string;
  expert_type: string;
  is_available: boolean;
  next_available_at: string | null;
  current_status: string;
  status_message: string | null;
  updated_at: string;
}

export const useExpertAvailability = (expertId?: string, expertType: string = 'doctor') => {
  const [availability, setAvailability] = useState<ExpertAvailability | null>(null);
  const [allAvailability, setAllAvailability] = useState<ExpertAvailability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      
      if (expertId) {
        // Fetch single expert availability
        const { data, error } = await supabase
          .from('expert_availability')
          .select('*')
          .eq('expert_id', expertId)
          .eq('expert_type', expertType)
          .single();

        if (!error && data) {
          setAvailability(data as ExpertAvailability);
        }
      } else {
        // Fetch all availability
        const { data, error } = await supabase
          .from('expert_availability')
          .select('*')
          .eq('expert_type', expertType);

        if (!error && data) {
          setAllAvailability(data as ExpertAvailability[]);
        }
      }
      
      setLoading(false);
    };

    fetchAvailability();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('expert-availability-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expert_availability',
          ...(expertId ? { filter: `expert_id=eq.${expertId}` } : {})
        },
        (payload) => {
          console.log('Availability change:', payload);
          
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newData = payload.new as ExpertAvailability;
            
            if (expertId) {
              setAvailability(newData);
            } else {
              setAllAvailability(prev => {
                const index = prev.findIndex(a => a.id === newData.id);
                if (index >= 0) {
                  const updated = [...prev];
                  updated[index] = newData;
                  return updated;
                }
                return [...prev, newData];
              });
            }
          } else if (payload.eventType === 'DELETE') {
            const oldData = payload.old as ExpertAvailability;
            setAllAvailability(prev => prev.filter(a => a.id !== oldData.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [expertId, expertType]);

  const getAvailabilityStatus = (id: string): ExpertAvailability | undefined => {
    return allAvailability.find(a => a.expert_id === id);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'available':
        return 'bg-green-500';
      case 'busy':
        return 'bg-yellow-500';
      case 'in_consultation':
        return 'bg-orange-500';
      case 'offline':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'available':
        return 'Available Now';
      case 'busy':
        return 'Busy';
      case 'in_consultation':
        return 'In Consultation';
      case 'offline':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  return {
    availability,
    allAvailability,
    loading,
    getAvailabilityStatus,
    getStatusColor,
    getStatusText
  };
};

export default useExpertAvailability;
