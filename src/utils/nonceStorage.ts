import { useLocalStorage } from "./useLocalStorage"

export const getDurableNonce = (userKey: string): string | null => {
  const storage = useLocalStorage()
  const durableNonceKey = storage.getItem(`durableNonce_${userKey}`)
  return durableNonceKey
}

export const setDurableNonce = (userKey: string, durableNonceKey: string) => {
  const storage = useLocalStorage()
  storage.setItem(`durableNonce_${userKey}`, durableNonceKey)
}
