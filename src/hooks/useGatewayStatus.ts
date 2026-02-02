import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { gatewayApi } from '../lib/api'

export function useGatewayStatus() {
  return useQuery({
    queryKey: ['gateway', 'status'],
    queryFn: gatewayApi.getStatus,
    refetchInterval: 10_000,
    staleTime: 5_000,
  })
}

export function useGatewayRestart() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: gatewayApi.restart,
    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['gateway', 'status'] })
      }, 3000)
    },
  })
}
