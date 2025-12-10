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
  Badge,
  IconButton,
  Card,
  CardBody,
  Avatar,
  Divider,
  Spinner,
  useToast,
  Textarea,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  FormControl,
  FormLabel,
  Select,
} from '@chakra-ui/react'
import Link from 'next/link'
import { ChevronLeftIcon, ArrowUpIcon, ArrowDownIcon } from '@chakra-ui/icons'
import { claimsAPI, rebuttalsAPI, votesAPI } from '@/lib/api'
import { getPartyName } from '@/lib/partyNames'

interface Rebuttal {
  id: number
  content: string
  user_id: number
  type: 'rebuttal' | 'counter'
  parent_id?: number
  votes: number
  author?: { name: string; affiliation?: string; level: number }
  user_vote?: string | null
}

export default function RebuttalPage({
  params,
}: {
  params: { id: string; claimId: string } | Promise<{ id: string; claimId: string }>
}) {
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [expandedRebuttals, setExpandedRebuttals] = useState<Set<number>>(new Set())
  const [originalClaim, setOriginalClaim] = useState<any>(null)
  const [rebuttals, setRebuttals] = useState<Rebuttal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newRebuttal, setNewRebuttal] = useState({ content: '', type: 'rebuttal' as 'rebuttal' | 'counter', parentId: undefined as number | undefined })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [claimId, setClaimId] = useState<string | null>(null)
  const [topicId, setTopicId] = useState<string | null>(null)

  useEffect(() => {
    // params가 Promise인 경우 처리
    const resolveParams = async () => {
      const resolvedParams = params instanceof Promise ? await params : params
      const id = resolvedParams?.id
      const claimIdParam = resolvedParams?.claimId
      if (id) {
        setTopicId(id)
      }
      if (claimIdParam) {
        setClaimId(claimIdParam)
      }
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    if (claimId) {
      loadData()
    }
  }, [claimId])

  const loadData = async (preserveScroll: boolean = false) => {
    if (!claimId) {
      return
    }
    
    const id = parseInt(claimId)
    if (isNaN(id)) {
      toast({
        title: '오류',
        description: '유효하지 않은 주장 ID입니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      setIsLoading(false)
      return
    }

    // 스크롤 위치 저장
    const scrollPosition = preserveScroll ? window.scrollY : undefined

    setIsLoading(true)
    try {
      const [claimData, rebuttalsData] = await Promise.all([
        claimsAPI.getClaim(id),
        rebuttalsAPI.getRebuttals(id),
      ])
      setOriginalClaim(claimData)
      setRebuttals(rebuttalsData)
      
      // 스크롤 위치 복원
      if (preserveScroll && scrollPosition !== undefined) {
        requestAnimationFrame(() => {
          window.scrollTo(0, scrollPosition)
        })
      }
    } catch (error: any) {
      console.error('반박 데이터 로드 에러:', error)
      toast({
        title: '오류',
        description: error.message || '데이터를 불러오는데 실패했습니다.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      setOriginalClaim(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitRebuttal = async () => {
    if (!newRebuttal.content) {
      toast({
        title: '오류',
        description: '내용을 입력해주세요.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    if (!claimId) {
      return
    }
    
    const id = parseInt(claimId)
    if (isNaN(id)) {
      toast({
        title: '오류',
        description: '유효하지 않은 주장 ID입니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsSubmitting(true)
    try {
      await rebuttalsAPI.createRebuttal({
        claim_id: id,
        parent_id: newRebuttal.parentId,
        content: newRebuttal.content,
        type: newRebuttal.type,
      })
      toast({
        title: '성공',
        description: '반박이 등록되었습니다.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      setNewRebuttal({ content: '', type: 'rebuttal', parentId: undefined })
      onClose()
      loadData(true)
    } catch (error: any) {
      toast({
        title: '오류',
        description: error.message || '반박 등록에 실패했습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  interface RebuttalNode extends Rebuttal {
    children: RebuttalNode[]
    author?: { name: string; affiliation?: string; level: number }
    user_vote?: string | null
  }

  const buildTree = (items: Rebuttal[]): RebuttalNode[] => {
    const map = new Map<number, RebuttalNode>()
    const roots: RebuttalNode[] = []

    items.forEach((item) => {
      map.set(item.id, { ...item, children: [] })
    })

    items.forEach((item) => {
      const node = map.get(item.id)!
      if (item.parent_id) {
        const parent = map.get(item.parent_id)
        if (parent) {
          parent.children.push(node)
        }
      } else {
        roots.push(node)
      }
    })

    return roots
  }

  const renderRebuttalTree = (
    rebuttal: RebuttalNode,
    depth: number = 0
  ) => {
    const isExpanded = expandedRebuttals.has(rebuttal.id)

    return (
      <Box key={rebuttal.id} ml={depth * 6}>
        <Card mb={2}>
          <CardBody>
            <VStack align="stretch" spacing={2}>
              <HStack justify="space-between">
                <HStack>
                  <Avatar size="sm" name={rebuttal.author?.name || `사용자 ${rebuttal.user_id}`} />
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm" fontWeight="bold">
                      {rebuttal.author?.name || `사용자 ${rebuttal.user_id}`}
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      {rebuttal.author?.affiliation ? `${getPartyName(rebuttal.author.affiliation)} · ` : ''}Lv.{rebuttal.author?.level || 1}
                    </Text>
                  </VStack>
                </HStack>
                <Badge colorScheme={rebuttal.type === 'rebuttal' ? 'orange' : 'blue'}>
                  {rebuttal.type === 'rebuttal' ? '반박' : '재반박'}
                </Badge>
              </HStack>
              <Text>{rebuttal.content}</Text>
              <HStack justify="space-between">
                <HStack spacing={2}>
                  <IconButton
                    aria-label="좋아요"
                    icon={<ArrowUpIcon />}
                    size="sm"
                    colorScheme={rebuttal.user_vote === 'like' ? 'green' : 'gray'}
                    variant={rebuttal.user_vote === 'like' ? 'solid' : 'outline'}
                    onClick={async () => {
                      try {
                        await votesAPI.vote({
                          rebuttal_id: rebuttal.id,
                          vote_type: 'like',
                        })
                        loadData(true)
                      } catch (error: any) {
                        toast({
                          title: '오류',
                          description: error.message || '투표에 실패했습니다.',
                          status: 'error',
                          duration: 3000,
                          isClosable: true,
                        })
                      }
                    }}
                  />
                  <Text fontSize="sm" fontWeight="bold">
                    {rebuttal.votes || 0}
                  </Text>
                  <IconButton
                    aria-label="싫어요"
                    icon={<ArrowDownIcon />}
                    size="sm"
                    colorScheme={rebuttal.user_vote === 'dislike' ? 'red' : 'gray'}
                    variant={rebuttal.user_vote === 'dislike' ? 'solid' : 'outline'}
                    onClick={async () => {
                      try {
                        await votesAPI.vote({
                          rebuttal_id: rebuttal.id,
                          vote_type: 'dislike',
                        })
                        loadData(true)
                      } catch (error: any) {
                        toast({
                          title: '오류',
                          description: error.message || '투표에 실패했습니다.',
                          status: 'error',
                          duration: 3000,
                          isClosable: true,
                        })
                      }
                    }}
                  />
                </HStack>
                {rebuttal.children.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const newExpanded = new Set(expandedRebuttals)
                      if (isExpanded) {
                        newExpanded.delete(rebuttal.id)
                      } else {
                        newExpanded.add(rebuttal.id)
                      }
                      setExpandedRebuttals(newExpanded)
                    }}
                  >
                    {isExpanded ? '접기' : `답변 ${rebuttal.children.length}개 보기`}
                  </Button>
                )}
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {isExpanded &&
          rebuttal.children.map((child) => renderRebuttalTree(child, depth + 1))}
      </Box>
    )
  }

  if (isLoading) {
    return (
      <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Text color="gray.600">반박을 불러오는 중...</Text>
        </VStack>
      </Box>
    )
  }

  if (!originalClaim && !isLoading) {
    return (
      <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <Text fontSize="xl" fontWeight="bold">주장을 찾을 수 없습니다</Text>
          {topicId && (
            <Link href={`/debate/topic/${topicId}`}>
              <Button colorScheme="blue">토론으로 돌아가기</Button>
            </Link>
          )}
        </VStack>
      </Box>
    )
  }

  const tree = buildTree(rebuttals)

  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          <HStack>
            {topicId && (
              <IconButton 
                aria-label="뒤로가기" 
                icon={<ChevronLeftIcon />}
                onClick={() => window.location.href = `/debate/topic/${topicId}`}
              />
            )}
            <Heading as="h1" size="xl" flex={1}>
              반박 및 재반박
            </Heading>
          </HStack>

          {originalClaim && (
            <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
              <VStack spacing={4} align="stretch">
                <Text fontWeight="bold" fontSize="lg">
                  원본 주장
                </Text>
                <Card>
                  <CardBody>
                    <VStack align="stretch" spacing={2}>
                      <Text fontWeight="bold">{originalClaim.title}</Text>
                      <Text>{originalClaim.content}</Text>
                      <HStack>
                        <Avatar size="sm" name="User" />
                        <Text fontSize="sm">
                          사용자 {originalClaim.user_id}
                        </Text>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </Box>
          )}

          <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
            <VStack spacing={4} align="stretch">
              <Text fontWeight="bold" fontSize="lg">
                반박 및 재반박 (Tree 구조)
              </Text>
              <Divider />
              <VStack align="stretch" spacing={2}>
                {tree.map((rebuttal) => renderRebuttalTree(rebuttal))}
              </VStack>
            </VStack>
          </Box>

          <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
            <Button colorScheme="blue" width="full" onClick={onOpen}>
              반박 작성하기
            </Button>
          </Box>
        </VStack>
      </Container>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>반박 작성</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>반박 유형</FormLabel>
                <Select
                  value={newRebuttal.type}
                  onChange={(e) => setNewRebuttal({ ...newRebuttal, type: e.target.value as 'rebuttal' | 'counter' })}
                >
                  <option value="rebuttal">반박</option>
                  <option value="counter">재반박</option>
                </Select>
              </FormControl>
              {newRebuttal.type === 'counter' && (
                <FormControl>
                  <FormLabel>상위 반박 선택 (선택사항)</FormLabel>
                  <Select
                    value={newRebuttal.parentId || ''}
                    onChange={(e) => setNewRebuttal({ ...newRebuttal, parentId: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="재반박할 반박을 선택하세요"
                  >
                    {rebuttals.filter(r => !r.parent_id).map(r => (
                      <option key={r.id} value={r.id}>
                        {r.content.substring(0, 50)}...
                      </option>
                    ))}
                  </Select>
                </FormControl>
              )}
              <FormControl>
                <FormLabel>내용</FormLabel>
                <Textarea
                  value={newRebuttal.content}
                  onChange={(e) => setNewRebuttal({ ...newRebuttal, content: e.target.value })}
                  placeholder="반박 내용을 입력하세요"
                  minH="200px"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              취소
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleSubmitRebuttal}
              isLoading={isSubmitting}
              loadingText="등록 중..."
            >
              등록
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

