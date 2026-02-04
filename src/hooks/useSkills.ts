import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { skillsApi, type Skill } from '@/lib/api'

export function useSkills(agentId?: string) {
  return useQuery<Skill[]>({
    queryKey: ['skills', agentId ?? 'global'],
    queryFn: () => skillsApi.list(agentId),
  })
}

export function useSkillInstall(agentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (skillName: string) => skillsApi.install(agentId, skillName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills', agentId] })
    },
  })
}

export function useSkillRemove(agentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (skillName: string) => skillsApi.remove(agentId, skillName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills', agentId] })
    },
  })
}
