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
  Icon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  Select,
  useDisclosure
} from '@chakra-ui/react'
import Link from 'next/link'
import { topicsAPI } from '@/lib/api'
import UserInfo from '@/components/UserInfo'
import { getUser } from '@/lib/auth' 
import { InfoIcon } from '@chakra-ui/icons'

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
  const { isOpen, onOpen, onClose } = useDisclosure() // 모달 제어
  
  const [selectedCategory, setSelectedCategory] = useState('politics')
  const [sortBy, setSortBy] = useState('best')
  const [topics, setTopics] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  // 주제 생성용 상태
  const [newTopicTitle, setNewTopicTitle] = useState('')
  const [newTopicCategory, setNewTopicCategory] = useState('politics')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    const currentUser = getUser()
    setUser(currentUser)
  }, [])

  const loadTopics = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await topicsAPI.getTopics(selectedCategory, undefined, undefined, 'topic', sortBy)
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
        status: 'info',
        duration: 3000,
        isClosable: true,
      })
      setTopics([])
    } finally {
      setIsLoading(false)
    }
  }, [selectedCategory, sortBy, toast])

  useEffect(() => {
    loadTopics()
  }, [loadTopics])

  // 주제 생성 핸들러
  const handleCreateTopic = async () => {
    if (!newTopicTitle.trim()) {
      toast({ title: '입력 오류', description: '주제명을 입력해주세요.', status: 'warning' })
      return
    }
    setIsCreating(true)
    try {
      await topicsAPI.createTopic({
        title: newTopicTitle,
        category: newTopicCategory,
        topic_type: 'topic'
      })
      toast({ title: '생성 완료', description: '새로운 토론 주제가 생성되었습니다.', status: 'success' })
      onClose()
      setNewTopicTitle('') // 입력창 초기화
      loadTopics() // 목록 새로고침
    } catch (error: any) {
      toast({ title: '생성 실패', description: error.message || '오류가 발생했습니다.', status: 'error' })
    } finally {
      setIsCreating(false)
    }
  }

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
              주제별 토론 게시판
            </Heading>
            <HStack spacing={2}>
              <UserInfo />
              {/* 관리자(admin) 계정일 때만 주제 생성 버튼 표시 (모달 오픈) */}
              {user && user.username === 'admin' && (
                <Button colorScheme="green" onClick={onOpen}>토론 주제 생성</Button>
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
                  // [수정] 카드 전체 Link 적용 및 버튼 제거
                  <Link href={`/debate/topic/${topic.id}`} key={topic.id} style={{ textDecoration: 'none' }}>
                    <Card 
                      variant="outline" 
                      borderColor="gray.200"
                      cursor="pointer"
                      transition="all 0.2s"
                      _hover={{ 
                        boxShadow: 'lg', 
                        borderColor: 'brand.500', 
                        transform: 'translateY(-2px)' 
                      }}
                    >
                      <CardBody py={4}>
                        <HStack justify="space-between">
                          <VStack align="start" spacing={1} w="100%">
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
                          {/* 토론 참여 버튼 제거됨 */}
                        </HStack>
                      </CardBody>
                    </Card>
                  </Link>
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
                  // [수정] 카드 전체 Link 적용 및 버튼 제거
                  <Link href={`/debate/topic/${topic.id}`} key={topic.id} style={{ textDecoration: 'none' }}>
                    <Card 
                      variant="outline" 
                      borderColor="gray.200"
                      cursor="pointer"
                      transition="all 0.2s"
                      _hover={{ 
                        boxShadow: 'md', 
                        borderColor: 'blue.400',
                        bg: 'gray.50'
                      }} 
                    >
                      <CardBody py={4}>
                        <HStack justify="space-between">
                          <VStack align="start" spacing={1} w="100%">
                            <Text fontWeight="bold" fontSize="md">{topic.title}</Text>
                            <Text fontSize="sm" color="gray.600">
                              {new Date(topic.created_at).toLocaleDateString('ko-KR')}
                            </Text>
                          </VStack>
                          {/* 토론 참여 버튼 제거됨 */}
                        </HStack>
                      </CardBody>
                    </Card>
                  </Link>
                ))}
              </VStack>
            )}
          </Box>
        </VStack>
      </Container>

      {/* 토론 주제 생성 모달 */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>새 토론 주제 생성</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>주제명</FormLabel>
                <Input 
                  placeholder="토론할 주제를 입력하세요" 
                  value={newTopicTitle}
                  onChange={(e) => setNewTopicTitle(e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel>카테고리</FormLabel>
                <Select 
                  value={newTopicCategory}
                  onChange={(e) => setNewTopicCategory(e.target.value)}
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>취소</Button>
            <Button colorScheme="green" onClick={handleCreateTopic} isLoading={isCreating}>
              생성하기
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}