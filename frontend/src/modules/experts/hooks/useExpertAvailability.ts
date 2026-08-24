import { useState, useEffect } from 'react';
import { db } from "@core/api/laravelGateway";

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

      try {
        if (expertId) {
          // Fetch single expert availability
          const row = await db
            .from('expert_availability')
            .select('*')
            .eq('expert_id', expertId)
            .eq('expert_type', expertType)
            .single();

          if (row) {
            setAvailability(row as unknown as ExpertAvailability);
          }
        } else {
          // Fetch all availability
          const rows = (await db
            .from('expert_availability')
            .select('*')
            .eq('expert_type', expertType)) as unknown as ExpertAvailability[];

          setAllAvailability(rows || []);
        }
      } catch {
        // fetch failed; keep previously loaded availability
      }

      setLoading(false);
    };

    fetchAvailability();

    // TODO: Realtime subscriptions will be implemented via WebSocket adapter
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
