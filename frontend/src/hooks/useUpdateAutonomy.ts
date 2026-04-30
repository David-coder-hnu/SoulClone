import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useUpdateAutonomy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (level: number) => {
      const { data } = await api.put('/clones/me', { autonomy_level: level })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clone-stats'] })
      queryClient.invalidateQueries({ queryKey: ['clone-profile'] })
    },
  })
}
