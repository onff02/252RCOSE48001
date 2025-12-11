import { setUser, removeUser } from './auth'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// 토큰 관리
export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token')
  }
  return null
}

export const setToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token)
  }
}

export const removeToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token')
  }
}

// API 요청 헬퍼
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: '알 수 없는 오류가 발생했습니다' }))
    throw new Error(error.detail || '요청에 실패했습니다')
  }

  return response.json()
}

// 인증 API
export const authAPI = {
  register: async (username: string, password: string, politicalParty?: string) => {
    const data = await apiRequest<{ access_token: string; user: any }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, political_party: politicalParty }),
    })
    if (data.access_token) {
      setToken(data.access_token)
    }
    if (data.user) {
      setUser(data.user)
    }
    return data
  },

  login: async (username: string, password: string) => {
    const data = await apiRequest<{ access_token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    if (data.access_token) {
      setToken(data.access_token)
    }
    if (data.user) {
      setUser(data.user)
    }
    return data
  },

  logout: () => {
    removeToken()
    removeUser()
  },
}

// 토론 주제 API
export const topicsAPI = {
  getTopics: async (
    category?: string, 
    region?: string, 
    district?: string,
    topicType?: string,
    sortBy: string = 'best'
  ) => {
    const params = new URLSearchParams()
    if (category) params.append('category', category)
    if (region) params.append('region', region)
    if (district) params.append('district', district)
    if (topicType) params.append('topic_type', topicType)
    params.append('sort_by', sortBy)
    
    return apiRequest<any[]>(`/api/topics?${params.toString()}`)
  },

  getTopic: async (id: number) => {
    return apiRequest<any>(`/api/topics/${id}`)
  },

  createTopic: async (topic: {
    title: string
    category?: string
    region?: string
    district?: string
    topic_type: string
  }) => {
    return apiRequest<any>('/api/topics', {
      method: 'POST',
      body: JSON.stringify(topic),
    })
  },
}

// 주장 API
export const claimsAPI = {
  getClaims: async (topicId: number, sortBy: string = 'best') => {
    return apiRequest<any[]>(`/api/claims/topic/${topicId}?sort_by=${sortBy}`)
  },

  getClaim: async (claimId: number) => {
    return apiRequest<any>(`/api/claims/${claimId}`)
  },

  getClaimEvidence: async (claimId: number) => {
    return apiRequest<any[]>(`/api/claims/${claimId}/evidence`)
  },

  createClaim: async (claim: {
    topic_id: number
    title: string
    content: string
    type: string
    evidence?: any[]
  }) => {
    return apiRequest<any>('/api/claims', {
      method: 'POST',
      body: JSON.stringify(claim),
    })
  },

  deleteClaim: async (claimId: number) => {
    return apiRequest<{ message: string }>(`/api/claims/${claimId}`, {
      method: 'DELETE',
    })
  },
}

// 반박 API
export const rebuttalsAPI = {
  getRebuttals: async (claimId: number) => {
    return apiRequest<any[]>(`/api/rebuttals/claim/${claimId}`)
  },

  createRebuttal: async (rebuttal: {
    claim_id: number
    parent_id?: number
    title: string
    content: string
    type: string
    evidence?: any[]
  }) => {
    return apiRequest<any>('/api/rebuttals', {
      method: 'POST',
      body: JSON.stringify(rebuttal),
    })
  },

  deleteRebuttal: async (rebuttalId: number) => {
    return apiRequest<{ message: string }>(`/api/rebuttals/${rebuttalId}`, { // 백엔드 rebuttals.py에도 delete 구현 필요
      method: 'DELETE',
    })
  },
}

// 투표 API
export const votesAPI = {
  vote: async (voteData: {
    claim_id?: number
    rebuttal_id?: number
    vote_type: 'like' | 'dislike'
  }) => {
    return apiRequest<{ message: string; votes: number; user_vote: string | null }>('/api/votes', {
      method: 'POST',
      body: JSON.stringify(voteData),
    })
  },
}

// AI API
export const aiAPI = {
  searchEvidence: async (query: string, searchDepth: string = 'advanced') => {
    return apiRequest<{ evidence: Array<{ source: string; publisher: string; text: string; url?: string }>; query: string }>('/api/ai/search-evidence', {
      method: 'POST',
      body: JSON.stringify({ query, search_depth: searchDepth }),
    })
  },

  improveText: async (text: string, context?: string) => {
    return apiRequest<{ improved_text: string; original_text: string }>('/api/ai/improve-text', {
      method: 'POST',
      body: JSON.stringify({ text, context }),
    })
  },
}

export const commonAPI = {
  deleteContent: async (type: 'claim' | 'rebuttal', id: number) => {
    // endpoint 예: /api/claims/1 or /api/rebuttals/1
    return apiRequest<any>(`/api/${type}s/${id}`, { method: 'DELETE' })
  },
  
  reportContent: async (type: 'claim' | 'rebuttal', id: number, reason: string) => {
    return apiRequest<any>('/api/reports', {
      method: 'POST',
      body: JSON.stringify({ target_type: type, target_id: id, reason })
    })
  },

  getNotifications: async () => {
    return apiRequest<any[]>('/api/notifications')
  }
}