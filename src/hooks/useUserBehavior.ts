
import { useQuery } from '@tanstack/react-query';
import { userBehaviorApi } from '@/services/userBehaviorApi';

export const useUserBehavior = (searchTerm?: string) => {
  const metricsQuery = useQuery({
    queryKey: ['user-behavior', 'metrics'],
    queryFn: userBehaviorApi.getMetrics,
    refetchInterval: 30000,
  });

  const sessionDataQuery = useQuery({
    queryKey: ['user-behavior', 'sessions'],
    queryFn: userBehaviorApi.getSessionData,
    refetchInterval: 60000,
  });

  const usersQuery = useQuery({
    queryKey: ['user-behavior', 'users', searchTerm],
    queryFn: () => userBehaviorApi.getUsers(searchTerm),
    refetchInterval: 30000,
  });

  return {
    metrics: metricsQuery.data,
    sessionData: sessionDataQuery.data,
    users: usersQuery.data,
    isLoading: metricsQuery.isLoading || sessionDataQuery.isLoading || usersQuery.isLoading,
    error: metricsQuery.error || sessionDataQuery.error || usersQuery.error,
    refetchUsers: usersQuery.refetch,
  };
};
