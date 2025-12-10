'use client'

import { useState, useEffect } from 'react'
import { Box, Container, Heading, Button, VStack, HStack, Text, SimpleGrid, Avatar, Badge, Icon } from '@chakra-ui/react'
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
      {/* 1. Hero Section: 브랜드 아이덴티티 적용 */}
      <Box bgGradient="linear(to-br, brand.600, brand.400)" color="white" pt={24} pb={32} position="relative" overflow="hidden">
        {/* 배경 장식용 원 (모던한 느낌 추가) */}
        <Box position="absolute" top="-10%" left="-5%" w="300px" h="300px" bg="whiteAlpha.100" borderRadius="full" filter="blur(50px)" />
        <Box position="absolute" bottom="-10%" right="-5%" w="400px" h="400px" bg="brand.300" opacity={0.3} borderRadius="full" filter="blur(60px)" />

        <Container maxW="container.xl" position="relative" zIndex={1}>
          <VStack spacing={8} align="center" textAlign="center">
            <Badge colorScheme="whiteAlpha" variant="solid" fontSize="sm" px={3} py={1} borderRadius="full">
              Beta v1.0
            </Badge>
            
            {/* 로고 & 슬로건 영역 */}
            <VStack spacing={2}>
              <Text fontSize={{ base: "lg", md: "2xl" }} fontWeight="medium" letterSpacing="wide" opacity={0.9}>
                너랑 나랑, 생각이 흐르는 길
              </Text>
              <Heading 
                as="h1" 
                size="4xl" 
                fontWeight="900" 
                letterSpacing="-0.03em" // 모던한 로고 느낌을 위한 자간 조정
                lineHeight="1"
              >
                이랑
              </Heading>
            </VStack>

            <Text fontSize="lg" opacity={0.85} maxW="2xl" pt={4}>
              서로의 다름을 이해하고 한 발짝 물러나 바라보는 곳.<br />
              AI와 함께 건전하고 논리적인 토론 문화를 만들어갑니다.
            </Text>
            
            {!user && (
              <HStack spacing={4} mt={8}>
                <Link href="/auth/login">
                  <Button size="lg" h="3.5rem" px={8} bg="white" color="brand.600" _hover={{ bg: 'gray.100', transform: 'translateY(-2px)' }} shadow="lg">
                    이랑 시작하기
                  </Button>
                </Link>
                <Link href="/debate/topic">
                  <Button size="lg" h="3.5rem" px={8} bg="whiteAlpha.300" color="white" _hover={{ bg: 'whiteAlpha.400', transform: 'translateY(-2px)' }} _active={{ bg: 'whiteAlpha.500' }} backdropFilter="blur(10px)">
                    토론 둘러보기
                  </Button>
                </Link>
              </HStack>
            )}
          </VStack>
        </Container>
      </Box>

      {/* 메인 컨텐츠 영역 (기존 유지하되 상단 마진 조정으로 겹치는 효과) */}
      <Container maxW="container.xl" pb={20} mt={-16} position="relative" zIndex={2}>
        
        {/* 사용자 정보 카드 (로그인 시) */}
        {user && (
          <Box bg="white" p={6} borderRadius="2xl" boxShadow="xl" mb={10} borderTop="4px solid" borderColor="brand.500">
            <HStack justify="space-between" wrap="wrap" spacing={4}>
              <HStack spacing={4}>
                <Avatar size="lg" name={user.username} bg="brand.500" />
                <VStack align="start" spacing={1}>
                  <HStack>
                    <Text fontWeight="bold" fontSize="xl">{user.username}님, 어서오세요!</Text>
                    {user.political_party && (
                      <Badge colorScheme="purple" variant="subtle">{getPartyName(user.political_party)}</Badge>
                    )}
                  </HStack>
                  <Text color="gray.500" fontSize="sm">
                    Lv.{user.level} · {user.affiliation ? getPartyName(user.affiliation) : '일반 토론자'}
                  </Text>
                </VStack>
              </HStack>
              <Button variant="ghost" colorScheme="gray" onClick={handleLogout} size="sm">로그아웃</Button>
            </HStack>
          </Box>
        )}

        {/* 2. 메인 기능 카드 (Grid Layout) */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} mb={16}>
          <Link href="/debate/topic" style={{ textDecoration: 'none' }}>
            <Box 
              p={8} bg="white" borderRadius="2xl" height="100%"
              boxShadow="lg" transition="all 0.3s"
              _hover={{ transform: 'translateY(-5px)', boxShadow: '2xl', borderColor: 'brand.300' }}
              border="1px solid" borderColor="gray.100"
              position="relative" overflow="hidden"
            >
              <Box position="absolute" top={0} right={0} p={4} opacity={0.05}>
                <Icon as={ChatIcon} w={40} h={40} color="brand.500" />
              </Box>
              <VStack align="start" spacing={4}>
                <Badge colorScheme="brand" variant="subtle" fontSize="sm">Global Issues</Badge>
                <Heading size="lg" letterSpacing="tight">주제별 토론장</Heading>
                <Text color="gray.600" fontSize="md" lineHeight="tall">
                  정치, 경제, 사회의 뜨거운 논제들.<br/> 
                  찬반 투표와 함께 당신의 논리를 펼쳐보세요.
                </Text>
                <HStack color="brand.500" fontWeight="bold" pt={2}>
                  <Text>토론 참여하기</Text>
                  <ArrowForwardIcon />
                </HStack>
              </VStack>
            </Box>
          </Link>

          <Link href="/debate/region" style={{ textDecoration: 'none' }}>
            <Box 
              p={8} bg="white" borderRadius="2xl" height="100%"
              boxShadow="lg" transition="all 0.3s"
              _hover={{ transform: 'translateY(-5px)', boxShadow: '2xl', borderColor: 'green.300' }}
              border="1px solid" borderColor="gray.100"
              position="relative" overflow="hidden"
            >
              <Box position="absolute" top={0} right={0} p={4} opacity={0.1}>
                <Box w={32} h={32} bg="green.500" borderRadius="full" filter="blur(40px)" />
              </Box>
              <VStack align="start" spacing={4}>
                <Badge colorScheme="green" variant="subtle" fontSize="sm">Local Community</Badge>
                <Heading size="lg" letterSpacing="tight">우리 동네 토론장</Heading>
                <Text color="gray.600" fontSize="md" lineHeight="tall">
                  내가 사는 지역의 현안을 확인하고,<br/>
                  이웃들과 함께 더 살기 좋은 동네를 만듭니다.
                </Text>
                <HStack color="green.500" fontWeight="bold" pt={2}>
                  <Text>지역 이슈 보기</Text>
                  <ArrowForwardIcon />
                </HStack>
              </VStack>
            </Box>
          </Link>
        </SimpleGrid>

        {/* 3. 실시간 인기 주제 */}
        <Box 
          p={8} bg="white" borderRadius="2xl" boxShadow="lg" 
          border="1px solid" borderColor="gray.100"
        >
          <HStack mb={6} justify="space-between">
            <Heading size="lg" letterSpacing="tight">🔥 지금 뜨거운 논제</Heading>
            <Text fontSize="sm" color="gray.500">실시간 참여도가 높은 토론입니다</Text>
          </HStack>
          
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10}>
            <Box>
              <Text fontWeight="bold" mb={4} color="gray.400" letterSpacing="wider" fontSize="xs" textTransform="uppercase">Best Topics</Text>
              <VStack align="stretch" spacing={2}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <HStack key={i} p={3} borderRadius="lg" _hover={{ bg: 'gray.50' }} cursor="pointer" justify="space-between" transition="background 0.2s">
                    <HStack spacing={4}>
                      <Text fontWeight="800" color="brand.500" w={4} textAlign="center">{i}</Text>
                      <Text fontWeight="medium" noOfLines={1}>인공지능 개발, 강력한 규제가 필요한가?</Text>
                    </HStack>
                    <Badge variant="outline" colorScheme="gray">1.2k</Badge>
                  </HStack>
                ))}
              </VStack>
            </Box>
            <Box borderLeft={{ md: "1px solid" }} borderColor="gray.100" pl={{ md: 10 }}>
              <Text fontWeight="bold" mb={4} color="gray.400" letterSpacing="wider" fontSize="xs" textTransform="uppercase">Region Hot</Text>
              <VStack align="stretch" spacing={2}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <HStack key={i} p={3} borderRadius="lg" _hover={{ bg: 'gray.50' }} cursor="pointer" justify="space-between" transition="background 0.2s">
                    <HStack spacing={4}>
                      <Text fontWeight="800" color="green.500" w={4} textAlign="center">{i}</Text>
                      <Text fontWeight="medium" noOfLines={1}>성북구 심야 버스 노선 확대안</Text>
                    </HStack>
                    <Badge colorScheme="green" variant="subtle">서울</Badge>
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