import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { agentsApi, type AgentPrompt } from '@/lib/api'

export function useAgentPrompt(agentId: string | null) {
  const queryClient = useQueryClient()

  const query = useQuery<AgentPrompt>({
    queryKey: ['agent-prompt', agentId],
    queryFn: () => agentsApi.getPrompt(agentId!),
    enabled: !!agentId,
    retry: false,
  })

  const mutation = useMutation({
    mutationFn: ({ id, prompt }: { id: string; prompt: string }) =>
      agentsApi.updatePrompt(id, prompt),
    onSuccess: (data) => {
      queryClient.setQueryData(['agent-prompt', agentId], data)
    },
  })

  return { query, mutation }
}
