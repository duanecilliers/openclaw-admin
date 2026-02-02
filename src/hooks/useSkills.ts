import { useQuery } from '@tanstack/react-query'
import { skillsApi, type Skill } from '@/lib/api'

export function useSkills() {
  return useQuery<Skill[]>({
    queryKey: ['skills'],
    queryFn: skillsApi.list,
  })
}
