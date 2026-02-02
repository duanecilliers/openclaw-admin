import { useQuery } from '@tanstack/react-query'
import { agentsApi, type Agent } from '@/lib/api'

export function useAgents() {
  return useQuery<Agent[]>({
    queryKey: ['agents'],
    queryFn: agentsApi.list,
  })
}
