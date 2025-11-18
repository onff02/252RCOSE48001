'use client'

import { useState, useEffect } from 'react'
import { Box, Container, Heading, Button, VStack, HStack, Text, SimpleGrid, Avatar, Badge } from '@chakra-ui/react'
import Link from 'next/link'
import { getUser, User } from '@/lib/auth'
import { authAPI } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { getPartyName } from '@/lib/partyNames'

export default function Home() {
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
  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Box textAlign="center" py={8}>
            <Heading as="h1" size="2xl" mb={4}>
              토론형 커뮤니티 서비스
            </Heading>
            <Text fontSize="lg" color="gray.600">
              논리적 토론을 위한 커뮤니티 플랫폼
            </Text>
          </Box>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            <Box
              p={6}
              bg="white"
              borderRadius="lg"
              boxShadow="md"
              _hover={{ boxShadow: "lg" }}
              transition="all 0.2s"
            >
              <VStack align="stretch" spacing={4}>
                <Heading as="h2" size="lg">
                  주제별 토론 게시판
                </Heading>
                <Text color="gray.600">
                  정치, 경제, 사회, 문화, IT, 세계 등 다양한 주제로 토론에 참여하세요.
                </Text>
                <Link href="/debate/topic">
                  <Button colorScheme="blue" width="full">
                    주제별 게시판 입장
                  </Button>
                </Link>
              </VStack>
            </Box>

            <Box
              p={6}
              bg="white"
              borderRadius="lg"
              boxShadow="md"
              _hover={{ boxShadow: "lg" }}
              transition="all 0.2s"
            >
              <VStack align="stretch" spacing={4}>
                <Heading as="h2" size="lg">
                  지역별 토론 게시판
                </Heading>
                <Text color="gray.600">
                  지역별 현안과 공약에 대해 토론하고 의견을 나누세요.
                </Text>
                <Link href="/debate/region">
                  <Button colorScheme="green" width="full">
                    지역별 게시판 입장
                  </Button>
                </Link>
              </VStack>
            </Box>
          </SimpleGrid>

          <Box
            p={6}
            bg="white"
            borderRadius="lg"
            boxShadow="md"
          >
            <VStack align="stretch" spacing={4}>
              <Heading as="h2" size="lg">
                인기 주제 요약
              </Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <Box>
                  <Text fontWeight="bold" mb={2}>주제별 HOT 5</Text>
                  <VStack align="stretch" spacing={2}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Text key={i} color="gray.600">
                        {i}. 인기 주제 {i}
                      </Text>
                    ))}
                  </VStack>
                </Box>
                <Box>
                  <Text fontWeight="bold" mb={2}>지역별 HOT 5</Text>
                  <VStack align="stretch" spacing={2}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Text key={i} color="gray.600">
                        {i}. 지역 주제 {i}
                      </Text>
                    ))}
                  </VStack>
                </Box>
              </SimpleGrid>
            </VStack>
          </Box>

          {user ? (
            <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
              <HStack justify="space-between">
                <HStack spacing={4}>
                  <Avatar name={user.username} />
                  <VStack align="start" spacing={0}>
                    <HStack>
                      <Text fontWeight="bold" fontSize="lg">
                        {user.username}
                      </Text>
                      {user.political_party && (
                        <Badge colorScheme="blue">{getPartyName(user.political_party)}</Badge>
                      )}
                    </HStack>
                    <Text fontSize="sm" color="gray.600">
                      레벨 {user.level} · {user.affiliation ? getPartyName(user.affiliation) : '일반 사용자'}
                    </Text>
                  </VStack>
                </HStack>
                <Button variant="outline" onClick={handleLogout}>
                  로그아웃
                </Button>
              </HStack>
            </Box>
          ) : (
            <HStack justify="center" spacing={4}>
              <Link href="/auth/login">
                <Button variant="outline">로그인</Button>
              </Link>
              <Link href="/auth/register">
                <Button colorScheme="blue">회원가입</Button>
              </Link>
            </HStack>
          )}
        </VStack>
      </Container>
    </Box>
  )
}
