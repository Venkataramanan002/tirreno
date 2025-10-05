
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/services/dashboardApi';

export const useDashboard = () => {
  const metricsQuery = useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: dashboardApi.getMetrics,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const threatTimelineQuery = useQuery({
    queryKey: ['dashboard', 'threat-timeline'],
    queryFn: dashboardApi.getThreatTimeline,
    refetchInterval: 60000, // Refetch every minute
  });

  const riskDistributionQuery = useQuery({
    queryKey: ['dashboard', 'risk-distribution'],
    queryFn: dashboardApi.getRiskDistribution,
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  const topThreatsQuery = useQuery({
    queryKey: ['dashboard', 'top-threats'],
    queryFn: dashboardApi.getTopThreats,
    refetchInterval: 60000,
  });

  return {
    metrics: metricsQuery.data,
    threatTimeline: threatTimelineQuery.data,
    riskDistribution: riskDistributionQuery.data,
    topThreats: topThreatsQuery.data,
    isLoading: metricsQuery.isLoading || threatTimelineQuery.isLoading || riskDistributionQuery.isLoading || topThreatsQuery.isLoading,
    error: metricsQuery.error || threatTimelineQuery.error || riskDistributionQuery.error || topThreatsQuery.error,
  };
};
