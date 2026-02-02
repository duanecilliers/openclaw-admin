import { useQuery } from '@tanstack/react-query'
import { configApi } from '@/lib/api'

export function useConfig() {
  return useQuery<{ config: any; updatedAt: string }>({
    queryKey: ['config'],
    queryFn: configApi.get,
  })
}
