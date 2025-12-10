// 사용자 정보 관리
export interface User {
  id: number
  username: string
  political_party?: string
  real_name?: string
  affiliation?: string
  level: number
}

export const getUser = (): User | null => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        return JSON.parse(userStr)
      } catch {
        return null
      }
    }
  }
  return null
}

export const setUser = (user: User): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user))
  }
}

export const removeUser = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user')
  }
}

