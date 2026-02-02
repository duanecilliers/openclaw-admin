import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cronApi, type CronJob } from '../lib/api'

const CRON_KEY = ['cron', 'jobs'] as const

export function useCronJobs() {
  return useQuery({
    queryKey: CRON_KEY,
    queryFn: cronApi.list,
    staleTime: 10_000,
  })
}

export function useToggleCronJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      cronApi.update(id, { enabled }),
    onMutate: async ({ id, enabled }) => {
      await qc.cancelQueries({ queryKey: CRON_KEY })
      const prev = qc.getQueryData<CronJob[]>(CRON_KEY)
      qc.setQueryData<CronJob[]>(CRON_KEY, (old) =>
        old?.map((j) => (j.id === id ? { ...j, enabled } : j))
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(CRON_KEY, ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: CRON_KEY }),
  })
}

export function useDeleteCronJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => cronApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: CRON_KEY }),
  })
}

export function useRunCronJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => cronApi.run(id),
    onSettled: () => {
      // Refresh after a bit to pick up new state
      setTimeout(() => qc.invalidateQueries({ queryKey: CRON_KEY }), 2000)
    },
  })
}
