import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useToggleActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (active: boolean) => {
      const endpoint = active ? '/clones/me/activate' : '/clones/me/deactivate'
      const { data } = await api.post(endpoint)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clone-stats'] })
    },
  })
}
