'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Container,
  Heading,
  Button,
  VStack,
  HStack,
  Text,
  Badge,
  Card,
  CardBody,
  Spinner,
  useToast,
  Icon
} from '@chakra-ui/react'
import Link from 'next/link'
import { topicsAPI } from '@/lib/api'
import UserInfo from '@/components/UserInfo'
import { getUser } from '@/lib/auth' 
import { InfoIcon } from '@chakra-ui/icons' // 정보 아이콘 추가

const categories = [
  { id: 'politics', name: '정치' },
  { id: 'economy', name: '경제' },
  { id: 'society', name: '사회' },
  { id: 'culture', name: '문화' },
  { id: 'it', name: 'IT' },
  { id: 'world', name: '세계' },
]

const sortOptions = [
  { id: 'best', name: 'Best' },
  { id: 'trend', name: 'Trend' },
  { id: 'new', name: 'New' },
]

export default function TopicDebatePage() {
  const toast = useToast()
  const [selectedCategory, setSelectedCategory] = useState('politics')
  const [sortBy, setSortBy] = useState('best')
  const [topics, setTopics] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true) // 초기 로딩 상태 true
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const currentUser = getUser()
    setUser(currentUser)
  }, [])

  const loadTopics = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await topicsAPI.getTopics(selectedCategory, undefined, undefined, 'topic', sortBy)
      // 데이터가 배열인지 확인하고 설정, 아니면 빈 배열
      if (Array.isArray(data)) {
        setTopics(data)
      } else {
        setTopics([])
      }
    } catch (error: any) {
      console.error('Failed to load topics:', error)
      toast({
        title: '알림',
        description: '주제 목록을 불러오지 못했거나 데이터가 없습니다.',
        status: 'info', // 에러보다는 info로 부드럽게 처리
        duration: 3000,
        isClosable: true,
      })
      setTopics([]) // 에러 시 빈 배열로 초기화
    } finally {
      setIsLoading(false) // 성공하든 실패하든 로딩 상태 반드시 해제
    }
  }, [selectedCategory, sortBy, toast])

  useEffect(() => {
    loadTopics()
  }, [loadTopics])

  // 공통으로 사용할 "데이터 없음" 컴포넌트
  const EmptyState = ({ message }: { message: string }) => (
    <VStack py={10} spacing={3} color="gray.500">
      <Icon as={InfoIcon} w={8} h={8} color="gray.400" />
      <Text fontSize="md">{message}</Text>
    </VStack>
  )

  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          <HStack justify="space-between">
            <Heading as="h1" size="xl">
              토론 게시판
            </Heading>
            <HStack spacing={2}>
              <UserInfo />
              {/* 관리자(admin) 계정일 때만 주제 생성 버튼 표시 */}
              {user && user.username === 'admin' && (
                <Link href="/write?type=topic">
                  <Button colorScheme="green">토론 주제 생성</Button>
                </Link>
              )}
            </HStack>
          </HStack>

          <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
            <VStack spacing={4} align="stretch">
              <Text fontWeight="bold" fontSize="lg">
                카테고리 선택
              </Text>
              <HStack spacing={2} flexWrap="wrap">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? 'solid' : 'outline'}
                    colorScheme={selectedCategory === category.id ? 'blue' : 'gray'}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {category.name}
                  </Button>
                ))}
              </HStack>
            </VStack>
          </Box>

          {/* HOT 5 주제 섹션 */}
          <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
            <HStack justify="space-between" mb={4}>
              <Heading as="h2" size="md">
                {categories.find((c) => c.id === selectedCategory)?.name} 게시판 HOT 5 주제
              </Heading>
              <HStack spacing={2}>
                {sortOptions.map((option) => (
                  <Button
                    key={option.id}
                    size="sm"
                    variant={sortBy === option.id ? 'solid' : 'outline'}
                    colorScheme={sortBy === option.id ? 'blue' : 'gray'}
                    onClick={() => setSortBy(option.id)}
                  >
                    {option.name}
                  </Button>
                ))}
              </HStack>
            </HStack>

            {isLoading ? (
              <Box textAlign="center" py={10}>
                <Spinner size="lg" color="brand.500" />
              </Box>
            ) : (!topics || topics.length === 0) ? (
              <EmptyState message="등록된 HOT 주제가 없습니다." />
            ) : (
              <VStack spacing={3} align="stretch">
                {topics.slice(0, 5).map((topic, index) => (
                  <Card key={topic.id} _hover={{ boxShadow: 'lg', borderColor: 'brand.500' }} cursor="pointer" variant="outline" borderColor="gray.200">
                    <CardBody py={4}>
                      <HStack justify="space-between">
                        <VStack align="start" spacing={1}>
                          <HStack>
                            <Badge colorScheme="red" variant="solid">HOT</Badge>
                            <Text fontWeight="bold" fontSize="lg">{index + 1}. {topic.title}</Text>
                          </HStack>
                          <HStack spacing={2} fontSize="sm" color="gray.500">
                            <Text>{new Date(topic.created_at).toLocaleDateString('ko-KR')}</Text>
                            <Text>•</Text>
                            <Text>참여 {topic.claims?.length || 0}명</Text>
                          </HStack>
                        </VStack>
                        <Link href={`/debate/topic/${topic.id}`}>
                          <Button colorScheme="blue" size="sm" variant="ghost">
                            토론 참여 &rarr;
                          </Button>
                        </Link>
                      </HStack>
                    </CardBody>
                  </Card>
                ))}
              </VStack>
            )}
          </Box>

          {/* 전체 주제 목록 섹션 */}
          <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
            <Heading as="h2" size="md" mb={4}>
              전체 주제 목록
            </Heading>
            
            {isLoading ? (
              <Box textAlign="center" py={10}>
                <Spinner size="lg" color="brand.500" />
              </Box>
            ) : (!topics || topics.length === 0) ? (
              <EmptyState message="등록된 주제가 없습니다." />
            ) : (
              <VStack spacing={3} align="stretch">
                {topics.map((topic) => (
                  <Card key={topic.id} _hover={{ boxShadow: 'lg', borderColor: 'blue.400' }} cursor="pointer" variant="outline" borderColor="gray.200">
                    <CardBody py={4}>
                      <HStack justify="space-between">
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="bold" fontSize="md">{topic.title}</Text>
                          <Text fontSize="sm" color="gray.600">
                            {new Date(topic.created_at).toLocaleDateString('ko-KR')}
                          </Text>
                        </VStack>
                        <Link href={`/debate/topic/${topic.id}`}>
                          <Button colorScheme="blue" size="sm">
                            토론 참여
                          </Button>
                        </Link>
                      </HStack>
                    </CardBody>
                  </Card>
                ))}
              </VStack>
            )}
          </Box>
        </VStack>
      </Container>
    </Box>
  )
}