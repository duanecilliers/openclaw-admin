import { useQuery } from '@tanstack/react-query'
import { channelsApi, type ChannelOverview } from '@/lib/api'

export function useChannels() {
  return useQuery<ChannelOverview>({
    queryKey: ['channels'],
    queryFn: channelsApi.list,
  })
}
