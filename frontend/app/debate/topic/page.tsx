'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Heading,
  Button,
  VStack,
  HStack,
  Text,
  SimpleGrid,
  Badge,
  Card,
  CardBody,
  Spinner,
  useToast,
} from '@chakra-ui/react'
import Link from 'next/link'
import { topicsAPI } from '@/lib/api'
import UserInfo from '@/components/UserInfo'

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
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadTopics()
  }, [selectedCategory, sortBy])

  const loadTopics = async () => {
    setIsLoading(true)
    try {
      const data = await topicsAPI.getTopics(selectedCategory, undefined, undefined, 'topic', sortBy)
      setTopics(data)
    } catch (error: any) {
      toast({
        title: '오류',
        description: error.message || '주제를 불러오는데 실패했습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      // 에러 발생 시 빈 배열로 설정
      setTopics([])
    } finally {
      setIsLoading(false)
    }
  }

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
              <Link href="/write">
                <Button colorScheme="green">글 작성</Button>
              </Link>
              <Link href="/">
                <Button variant="outline">메인으로</Button>
              </Link>
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
                            onClick={() => {
                              setSortBy(option.id)
                              // sortBy가 변경되면 useEffect가 자동으로 loadTopics를 호출함
                            }}
                          >
                            {option.name}
                          </Button>
                        ))}
                      </HStack>
                    </HStack>

            {isLoading ? (
              <Box textAlign="center" py={8}>
                <Spinner size="xl" />
              </Box>
            ) : topics.length === 0 ? (
              <Text textAlign="center" py={8} color="gray.500">
                등록된 주제가 없습니다.
              </Text>
            ) : (
              <VStack spacing={3} align="stretch">
                {topics.slice(0, 5).map((topic, index) => (
                  <Card key={topic.id} _hover={{ boxShadow: 'lg' }} cursor="pointer">
                    <CardBody>
                      <HStack justify="space-between">
                        <VStack align="start" spacing={1}>
                          <HStack>
                            <Badge colorScheme="red">HOT</Badge>
                            <Text fontWeight="bold">{index + 1}. {topic.title}</Text>
                          </HStack>
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

          <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
            <Heading as="h2" size="md" mb={4}>
              전체 주제 목록
            </Heading>
            {isLoading ? (
              <Box textAlign="center" py={8}>
                <Spinner size="xl" />
              </Box>
            ) : topics.length === 0 ? (
              <Text textAlign="center" py={8} color="gray.500">
                등록된 주제가 없습니다.
              </Text>
            ) : (
              <VStack spacing={3} align="stretch">
                {topics.map((topic) => (
                  <Card key={topic.id} _hover={{ boxShadow: 'lg' }} cursor="pointer">
                    <CardBody>
                      <HStack justify="space-between">
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="bold">{topic.title}</Text>
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

