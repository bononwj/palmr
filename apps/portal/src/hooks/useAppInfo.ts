import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { appInfoAtom, isLoadingAppInfoAtom, setAppInfoAtom, AppInfo } from '@/stores/app-info'

export function useAppInfo() {
  const appInfo = useAtomValue(appInfoAtom)
  const isLoadingAppInfo = useAtomValue(isLoadingAppInfoAtom)
  const setAppInfo = useSetAtom(setAppInfoAtom)

  return {
    appInfo,
    isLoadingAppInfo,
    setAppInfo,
  }
}

