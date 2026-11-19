import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { billingEnvironment } from '@/lib/billing';
import { getBilling } from '@/lib/billing.functions';
export function useBilling() { const { user } = useAuth(); return useQuery({ queryKey: ['billing', user?.id, billingEnvironment()], enabled: !!user, queryFn: () => getBilling({ data: { environment: billingEnvironment() } }), refetchInterval: 15000, staleTime: 5000 }); }
