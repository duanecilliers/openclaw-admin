import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { workspaceApi, type WorkspaceFileInfo, type WorkspaceFile } from '@/lib/api'

export function useWorkspaceFiles() {
  return useQuery<WorkspaceFileInfo[]>({
    queryKey: ['workspace-files'],
    queryFn: workspaceApi.listFiles,
  })
}

export function useWorkspaceFile(name: string | null) {
  return useQuery<WorkspaceFile>({
    queryKey: ['workspace-file', name],
    queryFn: () => workspaceApi.getFile(name!),
    enabled: !!name,
    retry: false,
  })
}

export function useWorkspaceFileSave() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ name, content }: { name: string; content: string }) =>
      workspaceApi.saveFile(name, content),
    onSuccess: (_data, variables) => {
      // Update the cached file content
      queryClient.setQueryData<WorkspaceFile>(
        ['workspace-file', variables.name],
        { name: variables.name, content: variables.content }
      )
      // Mark file as existing in the file list
      queryClient.setQueryData<WorkspaceFileInfo[]>(
        ['workspace-files'],
        (old) =>
          old?.map((f) =>
            f.name === variables.name ? { ...f, exists: true } : f
          )
      )
    },
  })
}
