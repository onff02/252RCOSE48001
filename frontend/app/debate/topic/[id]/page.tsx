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
  Card,
  CardBody,
  Badge,
  Avatar,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  useDisclosure,
  Divider,
  IconButton,
  Spinner,
  useToast,
  Textarea,
  FormControl,
  FormLabel,
  Select,
} from '@chakra-ui/react'
import Link from 'next/link'
import { ChevronLeftIcon, ChevronRightIcon, ArrowUpIcon, ArrowDownIcon } from '@chakra-ui/icons'
import { topicsAPI, claimsAPI, rebuttalsAPI, votesAPI } from '@/lib/api'
import { getPartyName } from '@/lib/partyNames'

export default function DebateDetailPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [topic, setTopic] = useState<any>(null)
  const [claims, setClaims] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [topicId, setTopicId] = useState<string | null>(null)
  const [expandedRebuttals, setExpandedRebuttals] = useState<Set<number>>(new Set())
  const [showRebuttalModal, setShowRebuttalModal] = useState(false)
  const [newRebuttal, setNewRebuttal] = useState({ content: '', type: 'rebuttal' as 'rebuttal' | 'counter', parentId: undefined as number | undefined })
  const [isSubmittingRebuttal, setIsSubmittingRebuttal] = useState(false)

  useEffect(() => {
    // params가 Promise인 경우 처리
    const resolveParams = async () => {
      try {
        const resolvedParams = params instanceof Promise ? await params : params
        const id = resolvedParams?.id
        console.log('Resolved topic ID:', id)
        if (id) {
          setTopicId(id)
        } else {
          console.error('No topic ID found in params')
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Error resolving params:', error)
        setIsLoading(false)
      }
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    if (topicId) {
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId])

  const loadData = async (preserveScroll: boolean = false) => {
    if (!topicId) {
      console.log('No topicId, skipping loadData')
      setIsLoading(false)
      return
    }
    
    const id = parseInt(topicId)
    if (isNaN(id)) {
      console.error('Invalid topic ID:', topicId)
      toast({
        title: '오류',
        description: '유효하지 않은 주제 ID입니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      setIsLoading(false)
      return
    }

    console.log('Loading topic data for ID:', id)

    // 스크롤 위치 저장
    const scrollPosition = preserveScroll ? window.scrollY : undefined

    setIsLoading(true)
    try {
      console.log('Fetching topic and claims for ID:', id)
      const [topicData, claimsData] = await Promise.all([
        topicsAPI.getTopic(id).catch((error) => {
          console.error('Error fetching topic:', error)
          throw error
        }),
        claimsAPI.getClaims(id).catch((error) => {
          console.error('Error fetching claims:', error)
          // claims가 없어도 topic은 표시할 수 있도록 빈 배열 반환
          return []
        }),
      ])
      console.log('Topic data:', topicData)
      console.log('Claims data:', claimsData)
      
      if (!topicData) {
        throw new Error('토론 주제를 불러올 수 없습니다')
      }
      
      setTopic(topicData)
      
      // claims가 없는 경우도 처리
      if (!claimsData || claimsData.length === 0) {
        console.log('No claims found for topic:', id)
        setClaims([])
      } else {
        // 각 주장에 근거 정보와 반박 정보 추가
        const claimsWithEvidence = await Promise.all(
          claimsData.map(async (claim: any) => {
            try {
              const [evidence, rebuttals] = await Promise.all([
                claimsAPI.getClaimEvidence(claim.id).catch(() => []),
                rebuttalsAPI.getRebuttals(claim.id).catch(() => [])
              ])
              return { ...claim, evidence, rebuttals: rebuttals || [] }
            } catch (error) {
              console.error('Error loading evidence/rebuttals for claim:', claim.id, error)
              return { ...claim, evidence: [], rebuttals: [] }
            }
          })
        )
        setClaims(claimsWithEvidence)
        console.log('Claims with evidence:', claimsWithEvidence)
      }
      
      // 스크롤 위치 복원
      if (preserveScroll && scrollPosition !== undefined) {
        requestAnimationFrame(() => {
          window.scrollTo(0, scrollPosition)
        })
      }
    } catch (error: any) {
      console.error('토론 주제 로드 에러:', error)
      console.error('Error details:', error.response || error.message || error)
      toast({
        title: '오류',
        description: error.message || '데이터를 불러오는데 실패했습니다.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      // 에러 발생 시 topic을 null로 설정하여 에러 화면 표시
      setTopic(null)
      setClaims([])
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Text color="gray.600">토론 주제를 불러오는 중...</Text>
        </VStack>
      </Box>
    )
  }

  if (!isLoading && !topic) {
    return (
      <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <Text fontSize="xl" fontWeight="bold">토론 주제를 찾을 수 없습니다</Text>
          <Text color="gray.600">주제 ID: {topicId || '없음'}</Text>
          <Link href="/debate/topic">
            <Button colorScheme="blue">토론 게시판으로 돌아가기</Button>
          </Link>
        </VStack>
      </Box>
    )
  }

  const currentClaim = claims[currentCardIndex] || null

  const handleEvidenceClick = (evidence: { source?: string; publisher?: string; text?: string }) => {
    const source = evidence.source || evidence.publisher || '출처 없음'
    const text = evidence.text || ''
    setSelectedEvidence(`${source}: ${text}`)
    onOpen()
  }

  const renderContentWithEvidence = (content: string, evidence: any[]) => {
    // 간단한 구현: 근거가 있으면 전체 내용에 밑줄 표시 가능
    return <>{content}</>
  }

  interface RebuttalNode {
    id: number
    content: string
    user_id: number
    type: 'rebuttal' | 'counter'
    parent_id?: number
    votes: number
    author?: { name: string; affiliation?: string; level: number }
    user_vote?: string | null
    children: RebuttalNode[]
  }

  const buildRebuttalTree = (items: any[]): RebuttalNode[] => {
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
        } else {
          // 부모가 없으면 루트로 추가
          roots.push(node)
        }
      } else {
        roots.push(node)
      }
    })

    return roots
  }

  const renderRebuttalTree = (rebuttal: RebuttalNode, depth: number = 0) => {
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
                <HStack spacing={2}>
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
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setNewRebuttal({ content: '', type: 'counter', parentId: rebuttal.id })
                      setShowRebuttalModal(true)
                    }}
                  >
                    답변
                  </Button>
                </HStack>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {isExpanded && rebuttal.children.map((child) => renderRebuttalTree(child, depth + 1))}
      </Box>
    )
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

    if (!currentClaim?.id) {
      return
    }

    setIsSubmittingRebuttal(true)
    try {
      await rebuttalsAPI.createRebuttal({
        claim_id: currentClaim.id,
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
      setShowRebuttalModal(false)
      // 데이터 다시 로드 (스크롤 위치 유지)
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
      setIsSubmittingRebuttal(false)
    }
  }

  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          <HStack>
            <IconButton 
              aria-label="뒤로가기" 
              icon={<ChevronLeftIcon />}
              onClick={() => window.location.href = '/debate/topic'}
            />
            <Heading as="h1" size="xl" flex={1}>
              {topic?.title || '토론 주제'}
            </Heading>
            <HStack spacing={2}>
              <Button size="sm" variant="outline">Best</Button>
              <Button size="sm" variant="outline">Trend</Button>
              {topicId && (
                <Button 
                  size="sm" 
                  colorScheme="green"
                  onClick={() => window.location.href = `/write?topic_id=${topicId}`}
                >
                  주장 작성
                </Button>
              )}
            </HStack>
          </HStack>

          <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
            <VStack spacing={4} align="stretch">
              <Text fontWeight="bold" fontSize="lg">
                주장 카드
              </Text>

              {claims.length === 0 ? (
                <Text textAlign="center" py={8} color="gray.500">
                  등록된 주장이 없습니다.
                </Text>
              ) : currentClaim ? (
                <Card
                  borderTop="4px solid"
                  borderColor={currentClaim.type === 'pro' ? 'blue.400' : 'red.400'}
                  bg={currentClaim.type === 'pro' ? 'blue.50' : 'red.50'}
                  shadow="lg"
                  borderRadius="xl"
                  overflow="hidden"
                >
                  <CardBody p={8}>
                    <VStack spacing={6} align="stretch">
                      
                      {/* 1. 상단 헤더: 작성자 정보와 찬반 배지를 배치 */}
                      <HStack justify="space-between">
                        <HStack spacing={3}>
                          <Avatar 
                            size="sm" 
                            name={currentClaim.author?.name || `사용자 ${currentClaim.user_id}`} 
                            bg={currentClaim.type === 'pro' ? 'blue.500' : 'red.500'}
                          />
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="bold" fontSize="sm">
                              {currentClaim.author?.name || `사용자 ${currentClaim.user_id}`}
                            </Text>
                            <HStack spacing={1}>
                              <Text fontSize="xs" color="gray.500">
                                {currentClaim.author?.affiliation ? `${getPartyName(currentClaim.author.affiliation)} · ` : ''}
                                Lv.{currentClaim.author?.level || 1}
                              </Text>
                              <Text fontSize="xs" color="gray.400">•</Text>
                              <Text fontSize="xs" color="gray.500">
                                {new Date(currentClaim.created_at).toLocaleDateString()}
                              </Text>
                            </HStack>
                          </VStack>
                        </HStack>
                        
                        <HStack>
                          {currentClaim.sticker && (
                            <Badge colorScheme={currentClaim.sticker === 'Best' ? 'red' : 'orange'} variant="solid" borderRadius="full" px={3}>
                              {currentClaim.sticker}
                            </Badge>
                          )}
                          <Badge 
                            colorScheme={currentClaim.type === 'pro' ? 'blue' : 'red'} 
                            variant="subtle" 
                            px={3} py={1} 
                            borderRadius="full" 
                            fontSize="md"
                          >
                            {currentClaim.type === 'pro' ? '찬성' : '반대'}
                          </Badge>
                        </HStack>
                      </HStack>

                      {/* 2. 본문 내용: 제목과 내용을 강조 */}
                      <Box py={2}>
                        <Heading size="md" mb={4} lineHeight="shorter" color="gray.800">
                          {currentClaim.title}
                        </Heading>
                        <Text fontSize="lg" lineHeight="1.8" color="gray.700">
                          {/* 근거가 있는 경우 텍스트 렌더링 함수 사용 (기존 로직 유지) */}
                          {renderContentWithEvidence(currentClaim.content, currentClaim.evidence || [])}
                        </Text>
                      </Box>

                      <Divider borderColor={currentClaim.type === 'pro' ? 'blue.200' : 'red.200'} />

                      {/* 3. 하단 액션 바: 투표 및 네비게이션 버튼 */}
                      <HStack justify="space-between" w="full">
                        {/* 투표 버튼 그룹 */}
                        <HStack spacing={4} bg="white" p={2} borderRadius="full" shadow="sm" border="1px solid" borderColor="gray.100">
                          <IconButton
                            aria-label="좋아요"
                            icon={<ArrowUpIcon boxSize={5} />}
                            size="sm"
                            variant="ghost"
                            colorScheme={currentClaim.user_vote === 'like' ? 'green' : 'gray'}
                            color={currentClaim.user_vote === 'like' ? 'green.500' : 'gray.400'}
                            onClick={async () => {
                              /* 기존 투표 로직 유지 */
                              try {
                                await votesAPI.vote({
                                  claim_id: currentClaim.id,
                                  vote_type: 'like',
                                })
                                loadData(true)
                              } catch (error: any) {
                                toast({ title: '오류', status: 'error', description: error.message })
                              }
                            }}
                          />
                          <Text fontSize="md" fontWeight="bold" color={currentClaim.votes > 0 ? 'green.500' : currentClaim.votes < 0 ? 'red.500' : 'gray.500'}>
                            {currentClaim.votes || 0}
                          </Text>
                          <IconButton
                            aria-label="싫어요"
                            icon={<ArrowDownIcon boxSize={5} />}
                            size="sm"
                            variant="ghost"
                            colorScheme={currentClaim.user_vote === 'dislike' ? 'red' : 'gray'}
                            color={currentClaim.user_vote === 'dislike' ? 'red.500' : 'gray.400'}
                            onClick={async () => {
                              /* 기존 투표 로직 유지 */
                              try {
                                await votesAPI.vote({
                                  claim_id: currentClaim.id,
                                  vote_type: 'dislike',
                                })
                                loadData(true)
                              } catch (error: any) {
                                toast({ title: '오류', status: 'error', description: error.message })
                              }
                            }}
                          />
                        </HStack>

                        {/* 카드 넘기기 및 반박 버튼 */}
                        <HStack spacing={3}>
                          <IconButton
                            aria-label="이전 카드"
                            icon={<ChevronLeftIcon boxSize={6} />}
                            variant="outline"
                            colorScheme="gray"
                            borderRadius="full"
                            onClick={() => setCurrentCardIndex((prev) => (prev > 0 ? prev - 1 : claims.length - 1))}
                            isDisabled={claims.length <= 1}
                          />
                          
                          <Text fontSize="sm" fontWeight="bold" color="gray.500" minW="60px" textAlign="center">
                            {currentCardIndex + 1} / {claims.length}
                          </Text>

                          <IconButton
                            aria-label="다음 카드"
                            icon={<ChevronRightIcon boxSize={6} />}
                            variant="outline"
                            colorScheme="gray"
                            borderRadius="full"
                            onClick={() => setCurrentCardIndex((prev) => (prev < claims.length - 1 ? prev + 1 : 0))}
                            isDisabled={claims.length <= 1}
                          />
                          
                          <Button
                            colorScheme="blue"
                            size="md"
                            px={6}
                            borderRadius="full"
                            boxShadow="md"
                            onClick={() => setShowRebuttalModal(true)}
                            leftIcon={<span>💬</span>}
                          >
                            반박하기
                          </Button>
                        </HStack>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              ) : null}
            </VStack>
          </Box>

          {/* 다른 주장 보기 */}
          <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
            <VStack spacing={4} align="stretch">
              <Heading as="h2" size="md">
                다른 주장 보기
              </Heading>
              <HStack spacing={2} overflowX="auto" pb={2}>
                {claims.map((claim, index) => (
                  <Card
                    key={claim.id}
                    minW="300px"
                    cursor="pointer"
                    onClick={() => setCurrentCardIndex(index)}
                    border={currentCardIndex === index ? '2px solid' : 'none'}
                    borderColor={currentCardIndex === index ? 'blue.500' : 'transparent'}
                  >
                    <CardBody>
                      <VStack align="start" spacing={2}>
                        {claim.sticker && (
                          <Badge colorScheme={claim.sticker === 'Best' ? 'red' : 'orange'}>
                            {claim.sticker}
                          </Badge>
                        )}
                        <Text fontWeight="bold" fontSize="sm" noOfLines={2}>
                          {claim.title}
                        </Text>
                        <HStack>
                          <Avatar size="xs" name={claim.author?.name || `사용자 ${claim.user_id}`} />
                          <Text fontSize="xs">{claim.author?.name || `사용자 ${claim.user_id}`}</Text>
                          <Text fontSize="xs" color="gray.600">
                            {claim.votes || 0}
                          </Text>
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </HStack>
            </VStack>
          </Box>

          {/* 반박 및 재반박 트리 */}
          {currentClaim && (
            <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <Heading as="h2" size="md">
                    반박 및 재반박
                  </Heading>
                  <Button size="sm" colorScheme="blue" onClick={() => setShowRebuttalModal(true)}>
                    반박 작성
                  </Button>
                </HStack>
                <Divider />
                {currentClaim.rebuttals && currentClaim.rebuttals.length > 0 ? (
                  <VStack align="stretch" spacing={2}>
                    {buildRebuttalTree(currentClaim.rebuttals).map((rebuttal) => renderRebuttalTree(rebuttal))}
                  </VStack>
                ) : (
                  <Text color="gray.500" textAlign="center" py={4}>
                    등록된 반박이 없습니다.
                  </Text>
                )}
              </VStack>
            </Box>
          )}

          {/* 본문에 사용된 근거 */}
          <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
            <VStack spacing={4} align="stretch">
              <Heading as="h2" size="md">
                본문에 사용된 근거
              </Heading>
              <VStack spacing={3} align="stretch">
                {currentClaim?.evidence?.map((ev: any, index: number) => {
                  // URL 추출: ev.url이 있으면 사용, 없으면 publisher가 URL인지 확인
                  const evidenceUrl = ev.url || (ev.publisher && ev.publisher.startsWith('http') ? ev.publisher : null)
                  const isClickable = !!evidenceUrl
                  
                  return (
                    <Card 
                      key={index} 
                      _hover={{ boxShadow: 'md', cursor: isClickable ? 'pointer' : 'default' }}
                      onClick={isClickable ? () => window.open(evidenceUrl, '_blank', 'noopener,noreferrer') : undefined}
                    >
                      <CardBody>
                        <VStack align="stretch" spacing={2}>
                          <HStack>
                            <Text as="span" fontWeight="bold" fontSize="sm" color="blue.600">
                              {index + 1}.
                            </Text>
                            {isClickable ? (
                              <Text
                                as="a"
                                href={evidenceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                fontWeight="bold"
                                fontSize="md"
                                color="blue.600"
                                _hover={{ color: 'blue.800', textDecoration: 'underline' }}
                                cursor="pointer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {ev.source || ev.publisher || '출처'}
                              </Text>
                            ) : (
                              <Text fontWeight="bold" fontSize="md">
                                {ev.source || ev.publisher || '출처 없음'}
                              </Text>
                            )}
                          </HStack>
                          {ev.text && (
                            <Text fontSize="sm" color="gray.700" pl={6} noOfLines={3}>
                              {ev.text.length > 100 ? `${ev.text.substring(0, 100)}...` : ev.text}
                            </Text>
                          )}
                          {evidenceUrl && (
                            <Text fontSize="xs" color="gray.500" pl={6}>
                              {evidenceUrl}
                            </Text>
                          )}
                        </VStack>
                      </CardBody>
                    </Card>
                  )
                })}
                {(!currentClaim?.evidence || currentClaim.evidence.length === 0) && (
                  <Text color="gray.500" fontSize="sm" textAlign="center" py={4}>
                    등록된 근거가 없습니다.
                  </Text>
                )}
              </VStack>
            </VStack>
          </Box>
        </VStack>
      </Container>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>근거 출처</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>{selectedEvidence}</Text>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* 반박 작성 모달 */}
      <Modal isOpen={showRebuttalModal} onClose={() => {
        setShowRebuttalModal(false)
        setNewRebuttal({ content: '', type: 'rebuttal', parentId: undefined })
      }} size="xl">
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
              {newRebuttal.type === 'counter' && currentClaim?.rebuttals && currentClaim.rebuttals.length > 0 && (
                <FormControl>
                  <FormLabel>상위 반박 선택 (선택사항)</FormLabel>
                  <Select
                    value={newRebuttal.parentId || ''}
                    onChange={(e) => setNewRebuttal({ ...newRebuttal, parentId: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="재반박할 반박을 선택하세요"
                  >
                    {currentClaim.rebuttals.filter((r: any) => !r.parent_id).map((r: any) => (
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
            <Button variant="ghost" mr={3} onClick={() => {
              setShowRebuttalModal(false)
              setNewRebuttal({ content: '', type: 'rebuttal', parentId: undefined })
            }}>
              취소
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSubmitRebuttal}
              isLoading={isSubmittingRebuttal}
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

