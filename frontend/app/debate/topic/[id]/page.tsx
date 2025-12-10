'use client'

import { useState, useEffect } from 'react'
import {
  Box, Container, Heading, Button, VStack, HStack, Text, Card, CardBody, Badge, Avatar, 
  Divider, IconButton, Spinner, useToast, Collapse, Icon, Flex
} from '@chakra-ui/react'
import Link from 'next/link'
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon, ChevronUpIcon, ArrowBackIcon } from '@chakra-ui/icons'
import { topicsAPI, claimsAPI, rebuttalsAPI, votesAPI } from '@/lib/api'
import { getPartyName } from '@/lib/partyNames'
import { useRouter } from 'next/navigation'

// 아이콘 (엄지척/엄지다운)
const ThumbsUpIcon = (props: any) => (
  <Icon viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
  </Icon>
)
const ThumbsDownIcon = (props: any) => (
  <Icon viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
  </Icon>
)

export default function DebateDetailPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const toast = useToast()
  const router = useRouter()
  
  // 상태 관리
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [topic, setTopic] = useState<any>(null)
  const [claims, setClaims] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [topicId, setTopicId] = useState<string | null>(null)

  // UI 상태
  const [isClaimsListOpen, setIsClaimsListOpen] = useState(false)
  const [claimSortBy, setClaimSortBy] = useState('best')
  const [isClaimEvidenceOpen, setIsClaimEvidenceOpen] = useState(false)
  
  // 토론장(반박) 관련 상태
  // [변경] 현재 보고 있는(Focus된) 반박 ID. null이면 최상위(Claim에 대한 직계 반박들)를 의미
  const [focusedRebuttalId, setFocusedRebuttalId] = useState<number | null>(null)
  // [변경] '다른 반박 보기' 펼침 상태
  const [isOtherRebuttalsOpen, setIsOtherRebuttalsOpen] = useState(false)

  useEffect(() => {
    const resolveParams = async () => {
      const resolved = params instanceof Promise ? await params : params
      if (resolved?.id) setTopicId(resolved.id)
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    if (topicId) loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId, claimSortBy])

  const loadData = async (preserveScroll = false) => {
    if (!topicId) return
    const id = parseInt(topicId)
    const scrollPosition = preserveScroll ? window.scrollY : undefined
    setIsLoading(true)

    try {
      const [topicData, claimsData] = await Promise.all([
        topicsAPI.getTopic(id),
        claimsAPI.getClaims(id, claimSortBy).catch(() => [])
      ])
      setTopic(topicData)
      
      if (claimsData?.length) {
        const fullClaims = await Promise.all(claimsData.map(async (c: any) => {
          const [ev, re] = await Promise.all([
            claimsAPI.getClaimEvidence(c.id).catch(() => []),
            rebuttalsAPI.getRebuttals(c.id).catch(() => [])
          ])
          return { ...c, evidence: ev, rebuttals: re || [] }
        }))
        setClaims(fullClaims)
      } else {
        setClaims([])
      }

      if (preserveScroll && scrollPosition) window.scrollTo(0, scrollPosition)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const currentClaim = claims[currentCardIndex] || null

  // [헬퍼] 근거 렌더링 컴포넌트
  const EvidenceSection = ({ evidence, isOpen, onToggle }: any) => (
    <Box mt={3}>
      <Button size="xs" variant="ghost" colorScheme="gray" onClick={onToggle} rightIcon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}>
        근거 {isOpen ? '접기' : '보기'}
      </Button>
      <Collapse in={isOpen} animateOpacity>
        <Box mt={2} p={3} bg="gray.50" borderRadius="md" borderLeft="3px solid" borderColor="gray.300">
          {evidence && evidence.length > 0 ? (
            <VStack align="stretch" spacing={2}>
              {evidence.map((ev: any, idx: number) => (
                <Text key={idx} fontSize="sm">
                  <Badge size="sm" mr={2}>{idx + 1}</Badge> 
                  {ev.source || ev.publisher || '출처'} 
                  {ev.text && <Text as="span" color="gray.500" ml={1}>- {ev.text}</Text>}
                </Text>
              ))}
            </VStack>
          ) : <Text fontSize="sm" color="gray.500" fontStyle="italic">근거가 없어요</Text>}
        </Box>
      </Collapse>
    </Box>
  )

  // [로직] 반박 트리 구조화
  interface RebuttalNode {
    id: number; content: string; type: string; votes: number; user_vote: any; author: any; parent_id?: number; children: RebuttalNode[]; created_at: string;
  }
  const buildRebuttalTree = (items: any[]): RebuttalNode[] => {
    const map = new Map<number, RebuttalNode>()
    items.forEach((item) => map.set(item.id, { ...item, children: [] }))
    const roots: RebuttalNode[] = []
    items.forEach((item) => {
      const node = map.get(item.id)!
      if (item.parent_id) {
        map.get(item.parent_id)?.children.push(node)
      } else {
        roots.push(node)
      }
    })
    return roots
  }

  // 현재 Claim의 전체 반박 트리
  const allRebuttals = currentClaim ? buildRebuttalTree(currentClaim.rebuttals) : []
  
  // [로직] 드릴다운을 위한 현재 뷰 데이터 계산
  // focusedRebuttalId가 null이면 -> Claim의 직계 반박들(Roots)을 보여줌
  // focusedRebuttalId가 있으면 -> 해당 반박을 "대표"로 보여주고, 그 자식들을 리스트로 보여줌
  
  let mainRebuttal: RebuttalNode | null = null
  let displayList: RebuttalNode[] = []

  if (focusedRebuttalId === null) {
    // 최상위 모드: '대표 반박'(Best) 하나와 '나머지 반박'들
    // 정렬: 좋아요 순
    const sortedRoots = [...allRebuttals].sort((a, b) => b.votes - a.votes)
    if (sortedRoots.length > 0) {
      mainRebuttal = sortedRoots[0] // 가장 인기 있는 반박을 메인으로
      displayList = sortedRoots.slice(1) // 나머지는 리스트로
    }
  } else {
    // 드릴다운 모드: 특정 반박을 포커스
    const findNode = (nodes: RebuttalNode[], id: number): RebuttalNode | null => {
      for (const node of nodes) {
        if (node.id === id) return node
        const found = findNode(node.children, id)
        if (found) return found
      }
      return null
    }
    const target = findNode(allRebuttals, focusedRebuttalId)
    if (target) {
      mainRebuttal = target
      displayList = target.children // 대댓글들
    }
  }

  // 반박 카드로 이동 (드릴다운)
  const handleDrillDown = (id: number) => {
    setFocusedRebuttalId(id)
    setIsOtherRebuttalsOpen(false) // 이동 시 접기 초기화
  }

  // 상위로 이동
  const handleGoUp = () => {
    if (!mainRebuttal) return
    if (mainRebuttal.parent_id) {
       setFocusedRebuttalId(mainRebuttal.parent_id)
    } else {
       setFocusedRebuttalId(null) // 최상위로
    }
  }

  // 작성 페이지로 이동
  const goToWrite = (type: 'claim' | 'rebuttal', parentId?: number) => {
    let url = `/write?topic_id=${topicId}&type=${type}`
    if (currentClaim) url += `&claim_id=${currentClaim.id}`
    if (parentId) url += `&parent_id=${parentId}`
    router.push(url)
  }

  if (isLoading) return <Box p={10} textAlign="center"><Spinner /></Box>
  if (!topic) return <Box p={10}>주제를 찾을 수 없습니다.</Box>

  return (
    <Box minH="100vh" bg="gray.50" pb={20}>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          {/* 헤더 */}
          <HStack>
            <IconButton aria-label="back" icon={<ChevronLeftIcon />} onClick={() => router.push('/debate/topic')} variant="ghost" />
            <Heading as="h1" size="lg">{topic.title}</Heading>
          </HStack>

          {/* [1] 다른 주장 보기 (상단, 접이식) */}
          <Box bg="white" borderRadius="lg" border="1px solid" borderColor="gray.200" overflow="hidden">
            <HStack p={4} bg="gray.50" justify="space-between" cursor="pointer" onClick={() => setIsClaimsListOpen(!isClaimsListOpen)}>
              <HStack><Heading size="md" color="gray.700">다른 주장 보기</Heading><Badge colorScheme="blue" borderRadius="full" px={2}>{claims.length}</Badge></HStack>
              <HStack><Text fontSize="sm" color="gray.500">{isClaimsListOpen ? '접기' : '펼치기'}</Text>{isClaimsListOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}</HStack>
            </HStack>
            <Collapse in={isClaimsListOpen} animateOpacity>
               <Box p={4}>
                 <HStack spacing={2} mb={3}>
                   {['best', 'new', 'trend'].map(opt => (
                     <Button key={opt} size="xs" colorScheme={claimSortBy===opt?'blue':'gray'} variant={claimSortBy===opt?'solid':'ghost'} onClick={()=>setClaimSortBy(opt)}>
                       {opt.toUpperCase()}
                     </Button>
                   ))}
                 </HStack>
                 <HStack spacing={4} overflowX="auto" pb={2}>
                   {claims.map((c, i) => (
                     <Card key={c.id} minW="200px" cursor="pointer" onClick={() => {setCurrentCardIndex(i); setFocusedRebuttalId(null);}} 
                           bg={currentCardIndex===i ? 'blue.50' : 'white'} border={currentCardIndex===i ? '2px solid' : '1px solid'} borderColor={currentCardIndex===i ? 'blue.500' : 'gray.200'}>
                       <CardBody p={3}><Text fontSize="sm" fontWeight="bold" noOfLines={1}>{c.title}</Text></CardBody>
                     </Card>
                   ))}
                 </HStack>
               </Box>
            </Collapse>
          </Box>

          {/* [2] 주장 글 카드 */}
          <Box>
            <Heading size="md" mb={2} color="gray.700">주장 글</Heading>
            {currentClaim ? (
              <Card borderTop="4px solid" borderColor={currentClaim.type === 'pro' ? 'blue.500' : 'red.500'} shadow="lg">
                <CardBody>
                  <HStack justify="space-between" mb={4}>
                    <HStack>
                      <Avatar size="sm" name={currentClaim.author?.name} />
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="bold">{currentClaim.author?.name}</Text>
                        <Text fontSize="xs" color="gray.500">{getPartyName(currentClaim.author?.affiliation)}</Text>
                      </VStack>
                    </HStack>
                    <Badge colorScheme={currentClaim.type === 'pro' ? 'blue' : 'red'}>{currentClaim.type === 'pro' ? '찬성' : '반대'}</Badge>
                  </HStack>
                  
                  <Heading size="lg" mb={4}>{currentClaim.title}</Heading>
                  <Text fontSize="lg" whiteSpace="pre-wrap" mb={4}>{currentClaim.content}</Text>
                  
                  {/* [추가] 주장 글 내부 근거 */}
                  <EvidenceSection evidence={currentClaim.evidence} isOpen={isClaimEvidenceOpen} onToggle={() => setIsClaimEvidenceOpen(!isClaimEvidenceOpen)} />

                  <Divider my={4} />
                  
                  {/* [수정] 버튼 배치: 투표(좌), 네비게이션(중), 새 주장(우) */}
                  <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
                    <HStack spacing={2}>
                      <IconButton aria-label="like" icon={<ThumbsUpIcon />} onClick={() => votesAPI.vote({ claim_id: currentClaim.id, vote_type: 'like' }).then(() => loadData(true))} />
                      <Text fontWeight="bold">{currentClaim.votes}</Text>
                      <IconButton aria-label="dislike" icon={<ThumbsDownIcon />} onClick={() => votesAPI.vote({ claim_id: currentClaim.id, vote_type: 'dislike' }).then(() => loadData(true))} />
                    </HStack>

                    <HStack spacing={2}>
                      <IconButton aria-label="prev" icon={<ChevronLeftIcon />} onClick={() => setCurrentCardIndex(p => p > 0 ? p - 1 : claims.length - 1)} isDisabled={claims.length <= 1} />
                      <Text fontSize="sm" fontWeight="bold" color="gray.500" w="50px" textAlign="center">{currentCardIndex + 1} / {claims.length}</Text>
                      <IconButton aria-label="next" icon={<ChevronRightIcon />} onClick={() => setCurrentCardIndex(p => p < claims.length - 1 ? p + 1 : 0)} isDisabled={claims.length <= 1} />
                    </HStack>

                    {/* [수정] '새 주장 작성' 버튼을 여기로 이동 */}
                    <Button colorScheme="green" size="md" onClick={() => goToWrite('claim')}>새 주장 작성</Button>
                  </Flex>
                </CardBody>
              </Card>
            ) : <Box p={10} bg="white" textAlign="center">주장이 없습니다.</Box>}
          </Box>

          {/* [3] 토론장 (반박 섹션) */}
          {currentClaim && (
            <Box bg="white" p={6} borderRadius="lg" shadow="md" borderTop="4px solid" borderColor="gray.300">
              <HStack justify="space-between" mb={4}>
                 {/* [수정] 제목 및 카운트(반박 수만) */}
                <Heading size="md">💬 토론장 ({currentClaim.rebuttals.length})</Heading>
                {/* [수정] '의견 남기기' -> '새 반박 작성' */}
                <Button colorScheme="red" onClick={() => goToWrite('rebuttal')}>새 반박 작성</Button>
              </HStack>
              <Divider mb={4} />

              {/* [수정] 드릴다운 UI */}
              {mainRebuttal ? (
                <VStack align="stretch" spacing={4}>
                  {/* 상위로 가기 버튼 (드릴다운 상태일 때만) */}
                  {focusedRebuttalId !== null && (
                    <Button leftIcon={<ArrowBackIcon />} size="sm" variant="ghost" alignSelf="start" onClick={handleGoUp}>
                      이전 글(상위)로 돌아가기
                    </Button>
                  )}

                  {/* 메인(대표) 반박 카드 */}
                  <Box>
                    <Text fontSize="sm" fontWeight="bold" color="red.500" mb={1}>
                      {focusedRebuttalId === null ? '🔥 대표 반박' : '보고 있는 반박'}
                    </Text>
                    <Card variant="outline" borderColor="red.200" bg="red.50">
                      <CardBody>
                        <HStack justify="space-between" mb={2}>
                          <HStack><Avatar size="xs" name={mainRebuttal.author?.name} /><Text fontWeight="bold" fontSize="sm">{mainRebuttal.author?.name}</Text></HStack>
                          {/* [수정] 반박은 빨간색 배지 */}
                          <Badge colorScheme="red">{mainRebuttal.type === 'counter' ? '재반박' : '반박'}</Badge>
                        </HStack>
                        <Text fontSize="md" mb={2}>{mainRebuttal.content}</Text>
                        
                        {/* 반박 근거 (반박도 근거 가질 수 있게 확장 시 사용) */}
                        <EvidenceSection evidence={mainRebuttal.evidence} isOpen={false} onToggle={()=>{}} />

                        <HStack mt={3} justify="space-between">
                           <HStack>
                             <Icon as={ThumbsUpIcon} color="gray.500" /> <Text fontSize="sm">{mainRebuttal.votes}</Text>
                           </HStack>
                           {/* 답글 달기 버튼 */}
                           <Button size="xs" colorScheme="blue" onClick={() => goToWrite('rebuttal', mainRebuttal?.id)}>이 글에 반박하기</Button>
                        </HStack>
                      </CardBody>
                    </Card>
                  </Box>

                  {/* 대댓글(하위 반박) 리스트 - 클릭 시 해당 글로 드릴다운 */}
                  <Box>
                    <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={2}>
                      ⬇️ 이 글에 대한 반박들 ({displayList.length})
                    </Text>
                    {displayList.length > 0 ? (
                      <VStack align="stretch" spacing={2}>
                        {displayList.map(child => (
                          <Card key={child.id} size="sm" cursor="pointer" _hover={{ bg: 'gray.50' }} onClick={() => handleDrillDown(child.id)}>
                            <CardBody py={2}>
                              <HStack justify="space-between">
                                <Text fontSize="sm" noOfLines={1}>{child.content}</Text>
                                <HStack spacing={1}><Icon as={ThumbsUpIcon} w={3} /><Text fontSize="xs">{child.votes}</Text></HStack>
                              </HStack>
                            </CardBody>
                          </Card>
                        ))}
                      </VStack>
                    ) : <Text fontSize="sm" color="gray.400" pl={2}>아직 반박이 없습니다.</Text>}
                  </Box>
                  
                  {/* [다른 반박 보기] - 최상위 모드일 때만 표시 */}
                  {focusedRebuttalId === null && allRebuttals.length > 1 && (
                    <Box mt={4}>
                       <Button size="sm" variant="link" onClick={() => setIsOtherRebuttalsOpen(!isOtherRebuttalsOpen)}>
                         다른 반박 더 보기 ({allRebuttals.length - 1}) {isOtherRebuttalsOpen ? <ChevronUpIcon/> : <ChevronDownIcon/>}
                       </Button>
                       <Collapse in={isOtherRebuttalsOpen}>
                         <VStack align="stretch" mt={2} spacing={2}>
                           {allRebuttals.filter(r => r.id !== mainRebuttal?.id).map(other => (
                             <Card key={other.id} size="sm" cursor="pointer" onClick={() => handleDrillDown(other.id)}>
                               <CardBody py={2}>
                                 <HStack justify="space-between">
                                   <Text fontSize="sm" noOfLines={1}>{other.content}</Text>
                                   <Badge size="sm">{other.votes}</Badge>
                                 </HStack>
                               </CardBody>
                             </Card>
                           ))}
                         </VStack>
                       </Collapse>
                    </Box>
                  )}
                </VStack>
              ) : (
                <Box textAlign="center" py={5} color="gray.500">등록된 반박이 없습니다. 첫 번째 반박을 남겨보세요!</Box>
              )}
            </Box>
          )}
        </VStack>
      </Container>
    </Box>
  )
}