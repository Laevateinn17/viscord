import { CURRENT_USER_CACHE, RELATIONSHIPS_CACHE } from "@/constants/cache";
import { RelationshipType } from "@/enums/relationship-type.enum";
import Relationship from "@/interfaces/relationship";
import { logout } from "@/services/auth/auth.service";
import { acceptFriendRequest, declineFriendRequest } from "@/services/relationships/relationships.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";


export function useLogoutMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => await logout(),
        onSuccess: () => {
            queryClient.removeQueries({ queryKey: [CURRENT_USER_CACHE] });
        }
    });
}

export function useDeleteRelationshipMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (relationship: Relationship) => declineFriendRequest(relationship.id),
        onSuccess: (_, relationship) => {
            queryClient.setQueryData<Relationship[]>([RELATIONSHIPS_CACHE], (old) => {
                if (!old) {
                    return [];
                }
                return old.filter(rel => rel.id !== relationship.id);
            })
        }
    });
}

export function useAcceptFriendRequestMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (relationship: Relationship) => acceptFriendRequest(relationship.id),
        onSuccess: (_, relationship) => {
            queryClient.setQueryData<Relationship[]>([RELATIONSHIPS_CACHE], (old) => {
                if (!old) {
                    return [relationship];
                }
                return old.map((rel) =>
                    rel.id === relationship.id ? { ...rel, type: RelationshipType.Friends } : rel
                );
            })
        }
    });
}