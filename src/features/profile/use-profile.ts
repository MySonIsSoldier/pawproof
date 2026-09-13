"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/auth-provider";
import { accountRequest } from "../account/api";
import {
  profileSchema,
  type AccountProfile,
} from "../../application/contracts/profile";
export function useProfile() {
  const auth = useAuth();
  const client = useQueryClient();
  const uid = auth.user?.uid;
  const key = ["account", uid, "profile"];
  const query = useQuery({
    queryKey: key,
    enabled: !!uid,
    queryFn: async ({ signal }) =>
      accountRequest(
        "/api/account/profile",
        profileSchema,
        await auth.token(uid!),
        "GET",
        undefined,
        signal,
      ),
  });
  const save = useMutation({
    mutationFn: async (profile: AccountProfile) =>
      accountRequest(
        "/api/account/profile",
        profileSchema,
        await auth.token(uid!),
        "PUT",
        { pets: profile.pets, expectedRevision: profile.revision },
      ),
    onSuccess: (data) => client.setQueryData(key, data),
  });
  return { ...query, save };
}
