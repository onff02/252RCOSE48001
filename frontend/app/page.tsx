// frontend/app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Box, Container, Heading, Button, VStack, HStack, Text, SimpleGrid, Avatar, Badge, Flex, Icon } from '@chakra-ui/react'
import Link from 'next/link'
import { getUser, User } from '@/lib/auth'
import { authAPI } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { getPartyName } from '@/lib/partyNames'
import { ArrowForwardIcon, ChatIcon } from '@chakra-ui/icons'

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
      {/* 1. Hero Section: 그라디언트 배경과 메인 메시지 */}
      <Box bgGradient="linear(to-r, brand.600, brand.400)" color="white" py={20} mb={10}>
        <Container maxW="container.xl">
          <VStack spacing={6} align="center" textAlign="center">
            <Badge colorScheme="whiteAlpha" variant="solid" fontSize="md" px={4} py={1}>
              Beta v1.0
            </Badge>
            <Heading as="h1" size="3xl" fontWeight="800" letterSpacing="tight">
              논리적인 토론, <br />
              더 나은 세상을 위한 시작
            </Heading>
            <Text fontSize="xl" opacity={0.9} maxW="2xl">
              정치, 경제, 사회 이슈에 대한 당신의 의견을 펼쳐보세요. 
              AI가 근거를 찾아주고 논리를 다듬어 드립니다.
            </Text>
            
            {!user && (
              <HStack spacing={4} mt={4}>
                <Link href="/auth/login">
                  <Button size="lg" bg="white" color="brand.600" _hover={{ bg: 'gray.100' }}>
                    시작하기
                  </Button>
                </Link>
                <Link href="/debate/topic">
                  <Button size="lg" variant="outline" colorScheme="whiteAlpha" color="white" _hover={{ bg: 'whiteAlpha.200' }}>
                    둘러보기
                  </Button>
                </Link>
              </HStack>
            )}
          </VStack>
        </Container>
      </Box>

      <Container maxW="container.xl" pb={20}>
        {/* 사용자 정보 카드 (로그인 시) */}
        {user && (
          <Box bg="white" p={6} borderRadius="2xl" boxShadow="lg" mb={10} borderTop="4px solid" borderColor="brand.500">
            <HStack justify="space-between" wrap="wrap" spacing={4}>
              <HStack spacing={4}>
                <Avatar size="lg" name={user.username} bg="brand.500" />
                <VStack align="start" spacing={1}>
                  <HStack>
                    <Text fontWeight="bold" fontSize="xl">{user.username}님, 환영합니다!</Text>
                    {user.political_party && (
                      <Badge colorScheme="purple" variant="subtle">{getPartyName(user.political_party)}</Badge>
                    )}
                  </HStack>
                  <Text color="gray.500">
                    Lv.{user.level} · {user.affiliation ? getPartyName(user.affiliation) : '일반 토론자'}
                  </Text>
                </VStack>
              </HStack>
              <Button variant="ghost" colorScheme="gray" onClick={handleLogout}>로그아웃</Button>
            </HStack>
          </Box>
        )}

        {/* 2. 메인 기능 카드 (Grid Layout) */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} mb={16}>
          <Link href="/debate/topic" style={{ textDecoration: 'none' }}>
            <Box 
              p={8} bg="white" borderRadius="2xl" height="100%"
              boxShadow="md" transition="all 0.3s"
              _hover={{ transform: 'translateY(-5px)', boxShadow: 'xl', borderColor: 'brand.300' }}
              border="1px solid" borderColor="transparent"
              position="relative" overflow="hidden"
            >
              <Box position="absolute" top={0} right={0} p={4} opacity={0.1}>
                <Icon as={ChatIcon} w={32} h={32} color="brand.500" />
              </Box>
              <VStack align="start" spacing={4}>
                <Badge colorScheme="blue" fontSize="sm">Global Issues</Badge>
                <Heading size="lg">주제별 토론장</Heading>
                <Text color="gray.600" fontSize="lg">
                  정치, 경제, IT 등 다양한 분야의 핫한 이슈에 대해<br/> 
                  찬반 투표와 심도 있는 토론을 나눠보세요.
                </Text>
                <HStack color="brand.500" fontWeight="bold">
                  <Text>토론 참여하기</Text>
                  <ArrowForwardIcon />
                </HStack>
              </VStack>
            </Box>
          </Link>

          <Link href="/debate/region" style={{ textDecoration: 'none' }}>
            <Box 
              p={8} bg="white" borderRadius="2xl" height="100%"
              boxShadow="md" transition="all 0.3s"
              _hover={{ transform: 'translateY(-5px)', boxShadow: 'xl', borderColor: 'green.300' }}
              border="1px solid" borderColor="transparent"
              position="relative" overflow="hidden"
            >
              <Box position="absolute" top={0} right={0} p={4} opacity={0.1}>
                {/* 아이콘 교체 가능 */}
                <Box w={32} h={32} bg="green.500" borderRadius="full" />
              </Box>
              <VStack align="start" spacing={4}>
                <Badge colorScheme="green" fontSize="sm">Local Community</Badge>
                <Heading size="lg">우리 동네 토론장</Heading>
                <Text color="gray.600" fontSize="lg">
                  내가 사는 지역의 현안과 공약을 확인하고,<br/>
                  이웃들과 함께 더 살기 좋은 동네를 만들어보세요.
                </Text>
                <HStack color="green.500" fontWeight="bold">
                  <Text>지역 이슈 보기</Text>
                  <ArrowForwardIcon />
                </HStack>
              </VStack>
            </Box>
          </Link>
        </SimpleGrid>

        {/* 3. 실시간 인기 주제 (Glassmorphism style card) */}
        <Box 
          p={8} bg="white" borderRadius="2xl" boxShadow="lg" 
          border="1px solid" borderColor="gray.100"
        >
          <Heading size="lg" mb={6}>🔥 지금 뜨거운 감자</Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
            <Box>
              <Text fontWeight="bold" mb={4} color="gray.500" letterSpacing="wider" fontSize="sm">BEST TOPICS</Text>
              <VStack align="stretch" spacing={3}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <HStack key={i} p={3} borderRadius="md" _hover={{ bg: 'gray.50' }} cursor="pointer" justify="space-between">
                    <HStack>
                      <Text fontWeight="bold" color="brand.500" w={6}>{i}</Text>
                      <Text fontWeight="medium">인공지능 개발, 규제가 필요한가?</Text>
                    </HStack>
                    <Badge>1.2k 참여</Badge>
                  </HStack>
                ))}
              </VStack>
            </Box>
            <Box borderLeft={{ md: "1px solid" }} borderColor="gray.100" pl={{ md: 8 }}>
              <Text fontWeight="bold" mb={4} color="gray.500" letterSpacing="wider" fontSize="sm">REGION HOT</Text>
              <VStack align="stretch" spacing={3}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <HStack key={i} p={3} borderRadius="md" _hover={{ bg: 'gray.50' }} cursor="pointer" justify="space-between">
                    <HStack>
                      <Text fontWeight="bold" color="green.500" w={6}>{i}</Text>
                      <Text fontWeight="medium">성북구 심야 버스 노선 확대안</Text>
                    </HStack>
                    <Badge colorScheme="green">서울</Badge>
                  </HStack>
                ))}
              </VStack>
            </Box>
          </SimpleGrid>
        </Box>
      </Container>
    </Box>
  )
}