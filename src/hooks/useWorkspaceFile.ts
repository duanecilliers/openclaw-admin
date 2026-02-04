import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { workspaceApi, agentWorkspaceApi, type WorkspaceFileInfo, type WorkspaceFile } from '@/lib/api'

export function useWorkspaceFiles(agentId?: string) {
  return useQuery<WorkspaceFileInfo[]>({
    queryKey: agentId ? ['workspace-files', agentId] : ['workspace-files'],
    queryFn: () => agentId ? agentWorkspaceApi.list(agentId) : workspaceApi.listFiles(),
  })
}

export function useWorkspaceFile(name: string | null, agentId?: string) {
  return useQuery<WorkspaceFile>({
    queryKey: agentId ? ['workspace-file', agentId, name] : ['workspace-file', name],
    queryFn: () =>
      agentId
        ? agentWorkspaceApi.get(agentId, name!)
        : workspaceApi.getFile(name!),
    enabled: !!name,
    retry: false,
  })
}

export function useWorkspaceFileSave(agentId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ name, content }: { name: string; content: string }) =>
      agentId
        ? agentWorkspaceApi.save(agentId, name, content)
        : workspaceApi.saveFile(name, content),
    onSuccess: (_data, variables) => {
      // Update the cached file content
      const fileKey = agentId
        ? ['workspace-file', agentId, variables.name]
        : ['workspace-file', variables.name]
      queryClient.setQueryData<WorkspaceFile>(fileKey, {
        name: variables.name,
        content: variables.content,
      })
      // Mark file as existing in the file list
      const filesKey = agentId ? ['workspace-files', agentId] : ['workspace-files']
      queryClient.setQueryData<WorkspaceFileInfo[]>(filesKey, (old) =>
        old?.map((f) =>
          f.name === variables.name ? { ...f, exists: true } : f
        )
      )
    },
  })
}
