'use client'

import { useState, useEffect } from 'react'
import { Box, HStack, VStack, Text, Avatar, Badge, Button } from '@chakra-ui/react'
import { getUser, User } from '@/lib/auth'
import { authAPI } from '@/lib/api'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getPartyName } from '@/lib/partyNames'

export default function UserInfo() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const currentUser = getUser()
    setUser(currentUser)
  }, [])

  const handleLogout = () => {
    authAPI.logout()
    setUser(null)
    router.push('/')
  }

  if (!user) {
    return (
      <HStack spacing={4}>
        <Link href="/auth/login">
          <Button variant="outline" size="sm">로그인</Button>
        </Link>
        <Link href="/auth/register">
          <Button colorScheme="blue" size="sm">회원가입</Button>
        </Link>
      </HStack>
    )
  }

  return (
    <HStack spacing={4}>
      <Avatar name={user.username} size="sm" />
      <VStack align="start" spacing={0}>
        <HStack>
          <Text fontWeight="bold" fontSize="sm">
            {user.username}
          </Text>
          {user.political_party && (
            <Badge colorScheme="blue" fontSize="xs">{getPartyName(user.political_party)}</Badge>
          )}
        </HStack>
        <Text fontSize="xs" color="gray.600">
          Lv.{user.level}
        </Text>
      </VStack>
      <Button variant="outline" size="sm" onClick={handleLogout}>
        로그아웃
      </Button>
    </HStack>
  )
}

