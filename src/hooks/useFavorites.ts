import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export function useFavorites() {
  const { user } = useAuth();
  const client = useQueryClient();
  const queryKey = ["image-favorites", user?.id];
  const query = useQuery({
    queryKey,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("image_favorites").select("image_id");
      if (error) throw error;
      return new Set((data ?? []).map((row) => row.image_id));
    },
  });
  const toggle = useMutation({
    mutationFn: async (imageId: string) => {
      if (!user) throw new Error("Entre para guardar suas favoritas.");
      const request = query.data?.has(imageId)
        ? supabase.from("image_favorites").delete().eq("image_id", imageId).eq("user_id", user.id)
        : supabase.from("image_favorites").insert({ image_id: imageId, user_id: user.id });
      const { error } = await request;
      if (error) throw error;
    },
    onSuccess: () => client.invalidateQueries({ queryKey }),
    onError: () => toast.error("Não foi possível atualizar suas favoritas. Tente novamente."),
  });
  return { ...query, favorites: query.data ?? new Set<string>(), toggle, user };
}