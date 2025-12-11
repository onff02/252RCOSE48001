'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Box, Container, Heading, Button, VStack, HStack, Text, Card, CardBody, Badge, Avatar, 
  Divider, IconButton, Spinner, useToast, Collapse, Icon, Flex,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, ModalFooter, useDisclosure,
  Menu, MenuButton, MenuList, MenuItem, Portal, Link as ChakraLink
} from '@chakra-ui/react'
import { 
  ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon, ChevronUpIcon, 
  ChatIcon, AddIcon, WarningTwoIcon, DeleteIcon, ExternalLinkIcon, CloseIcon 
} from '@chakra-ui/icons'
import { topicsAPI, claimsAPI, rebuttalsAPI, votesAPI, commonAPI } from '@/lib/api'
import { getPartyName } from '@/lib/partyNames'
import { getUser } from '@/lib/auth'
import { useRouter } from 'next/navigation'

// --- 아이콘 컴포넌트 ---
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
const MoreVertIcon = (props: any) => (
  <Icon viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
  </Icon>
)

// --- 타입 정의 ---
interface DebateNode {
  id: number
  nodeType: 'claim' | 'rebuttal'
  claimType: 'pro' | 'con'
  title?: string
  content: string
  votes: number
  user_vote?: string | null
  author: any
  children: DebateNode[]
  created_at: string
  evidence?: any[]
  parent_id?: number
  claim_id?: number
}

// --- 트리 탐색 함수 ---
const findNode = (nodes: DebateNode[], id: number, type: 'claim' | 'rebuttal'): DebateNode | null => {
  for (const node of nodes) {
    if (node.id === id && node.nodeType === type) return node
    if (node.children.length > 0) {
      const found = findNode(node.children, id, type)
      if (found) return found
    }
  }
  return null
}

// --- 상세 보기 모달 ---
const DetailModal = ({ isOpen, onClose, item, currentUser, onDelete, onReport, onWrite, onVote }: any) => {
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false)
  if (!item) return null

  const isMyPost = currentUser && item.author?.name === currentUser.username
  const badgeColor = item.claimType === 'pro' ? 'blue' : 'red'

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(5px)" />
      <ModalContent borderRadius="xl">
        <ModalHeader fontSize="lg" borderBottom="1px solid" borderColor="gray.100">
          <HStack justify="space-between" pr={8}>
            <HStack>
              <Badge colorScheme={badgeColor}>
                {item.nodeType === 'claim' ? (item.claimType === 'pro' ? '찬성' : '반대') : (item.type === 'counter' ? '재반박' : '반박')}
              </Badge>
              <Text fontSize="md" noOfLines={1}>{item.title || '의견 상세'}</Text>
            </HStack>
            <Menu>
              <MenuButton as={IconButton} icon={<MoreVertIcon />} variant="ghost" size="sm" />
              <Portal>
                <MenuList zIndex={1500}>
                  {isMyPost ? (
                    <MenuItem icon={<DeleteIcon />} color="red.500" onClick={() => onDelete(item)}>삭제하기</MenuItem>
                  ) : (
                    <MenuItem icon={<WarningTwoIcon />} onClick={() => onReport(item)}>신고하기</MenuItem>
                  )}
                </MenuList>
              </Portal>
            </Menu>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody py={6}>
          <HStack mb={4}>
            <Avatar size="sm" name={item.author?.name} />
            <VStack align="start" spacing={0}>
              <Text fontWeight="bold" fontSize="sm">{item.author?.name}</Text>
              <Text fontSize="xs" color="gray.500">{getPartyName(item.author?.affiliation)}</Text>
            </VStack>
          </HStack>
          
          <Text fontSize="md" whiteSpace="pre-wrap" lineHeight="1.8" mb={6}>
            {item.content}
          </Text>

          <Box>
            <Button 
              size="sm" variant="ghost" 
              rightIcon={isEvidenceOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
              onClick={() => setIsEvidenceOpen(!isEvidenceOpen)}
              colorScheme="gray"
            >
              첨부된 근거 ({item.evidence?.length || 0})
            </Button>
            <Collapse in={isEvidenceOpen}>
              <VStack align="stretch" mt={2} p={3} bg="gray.50" borderRadius="md" spacing={2}>
                {item.evidence && item.evidence.length > 0 ? (
                  item.evidence.map((ev: any, idx: number) => (
                    <Box key={idx} fontSize="sm">
                      {ev.url ? (
                        <ChakraLink 
                          href={ev.url} 
                          isExternal 
                          color="black"
                          textDecoration="none"
                          _hover={{ textDecoration: 'underline' }}
                          display="inline-flex"
                          alignItems="center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          ✅ <Text as="span" fontWeight="bold" mx={1}>{ev.source}</Text>: {ev.text}
                          <ExternalLinkIcon mx="2px" boxSize={3} color="gray.500" />
                        </ChakraLink>
                      ) : (
                        <Text color="black">
                          ✅ <Text as="span" fontWeight="bold">{ev.source}</Text>: {ev.text}
                        </Text>
                      )}
                    </Box>
                  ))
                ) : <Text fontSize="sm" color="gray.500">근거가 없습니다.</Text>}
              </VStack>
            </Collapse>
          </Box>
        </ModalBody>
        <ModalFooter borderTop="1px solid" borderColor="gray.100">
          <HStack w="full" justify="space-between">
            <HStack spacing={2}>
              <IconButton 
                aria-label="like" 
                icon={<ThumbsUpIcon />} 
                onClick={() => onVote(item, 'like')} 
                size="sm" 
                colorScheme={item.user_vote === 'like' ? 'blue' : 'gray'} 
                variant={item.user_vote === 'like' ? 'solid' : 'outline'} 
              />
              <Text fontWeight="bold">{item.votes}</Text>
              <IconButton 
                aria-label="dislike" 
                icon={<ThumbsDownIcon />} 
                onClick={() => onVote(item, 'dislike')} 
                size="sm" 
                colorScheme={item.user_vote === 'dislike' ? 'red' : 'gray'} 
                variant={item.user_vote === 'dislike' ? 'solid' : 'outline'} 
              />
            </HStack>
            <Button colorScheme="green" size="sm" onClick={() => onWrite(item)}>
              {item.nodeType === 'claim' ? '반박 작성' : '답글 작성'}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

// --- 토론 카드 ---
const DebateCard = ({ 
  item, level, rootType, isSelected, 
  onSelect, onDetail, onVote, 
  currentUser, onDelete, onReport,
  onWrite, onClose
}: any) => {
  const isEvenLevel = level % 2 === 0
  const isRootPro = rootType === 'pro'
  const isCardPro = level === 0 ? item.claimType === 'pro' : (isRootPro ? isEvenLevel : !isEvenLevel)
  
  const borderColor = isCardPro ? 'blue.500' : 'red.500'
  const badgeColor = isCardPro ? 'blue' : 'red'
  const badgeText = level === 0 ? (isCardPro ? '찬성' : '반대') : (level % 2 === 1 ? '반박' : '재반박')
  
  const isMyPost = currentUser && item.author?.name === currentUser.username
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false)

  // 1. 선택된 상태(Expanded View)
  if (isSelected) {
    return (
      <Card 
        w="full" 
        border="2px solid" 
        borderColor={borderColor} 
        boxShadow="lg"
        bg="white"
        transition="all 0.3s"
      >
        <CardBody>
          <HStack justify="space-between" mb={4} align="start">
            <HStack>
              <Avatar size="sm" name={item.author?.name} />
              <VStack align="start" spacing={0}>
                <Text fontWeight="bold">{item.author?.name}</Text>
                <Text fontSize="xs" color="gray.500">{getPartyName(item.author?.affiliation)}</Text>
              </VStack>
            </HStack>
            <HStack>
              <Badge colorScheme={badgeColor} fontSize="0.8em" px={2} py={1} borderRadius="full">
                {badgeText}
              </Badge>
              {/* 닫기 버튼 */}
              <IconButton
                aria-label="close"
                icon={<CloseIcon />}
                size="xs"
                variant="ghost"
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                color="gray.500"
              />
              <Menu>
                <MenuButton as={IconButton} icon={<MoreVertIcon />} size="sm" variant="ghost" />
                <Portal>
                  <MenuList zIndex={1500}>
                    {isMyPost ? (
                      <MenuItem icon={<DeleteIcon />} color="red.500" onClick={() => onDelete(item)}>삭제하기</MenuItem>
                    ) : (
                      <MenuItem icon={<WarningTwoIcon />} onClick={() => onReport(item)}>신고하기</MenuItem>
                    )}
                  </MenuList>
                </Portal>
              </Menu>
            </HStack>
          </HStack>

          {item.title && <Heading size="md" mb={3}>{item.title}</Heading>}
          <Text fontSize="md" whiteSpace="pre-wrap" mb={4} lineHeight="1.7">
            {item.content}
          </Text>

          {/* 근거 섹션 */}
          <Box mb={6}>
            <Button 
              size="xs" variant="ghost" colorScheme="gray" 
              onClick={() => setIsEvidenceOpen(!isEvidenceOpen)} 
              rightIcon={isEvidenceOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            >
              근거 자료 {isEvidenceOpen ? '접기' : '보기'}
            </Button>
            <Collapse in={isEvidenceOpen}>
              <VStack align="stretch" mt={2} p={3} bg="gray.50" borderRadius="md" borderLeft="3px solid" borderColor="gray.300" spacing={1}>
                {item.evidence && item.evidence.length > 0 ? (
                  item.evidence.map((ev: any, idx: number) => (
                    <Box key={idx} fontSize="sm">
                      {ev.url ? (
                        <ChakraLink 
                          href={ev.url} 
                          isExternal 
                          color="black"
                          textDecoration="none"
                          _hover={{ textDecoration: 'underline' }}
                          display="inline-flex"
                          alignItems="center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          ✅ <Text as="span" fontWeight="bold" mx={1}>{ev.source}</Text>: {ev.text && ev.text.substring(0, 80) + (ev.text.length > 80 ? '...' : '')}
                          <ExternalLinkIcon mx="2px" boxSize={3} color="gray.500" />
                        </ChakraLink>
                      ) : (
                        <Text color="black">
                          ✅ <Text as="span" fontWeight="bold">{ev.source}</Text>: {ev.text && ev.text.substring(0, 80) + (ev.text.length > 80 ? '...' : '')}
                        </Text>
                      )}
                    </Box>
                  ))
                ) : <Text fontSize="sm" color="gray.500">등록된 근거가 없습니다.</Text>}
              </VStack>
            </Collapse>
          </Box>

          <Divider mb={4} />

          <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
            <HStack spacing={2}>
              <IconButton aria-label="like" icon={<ThumbsUpIcon />} onClick={() => onVote(item, 'like')} size="sm" colorScheme={item.user_vote === 'like' ? 'blue' : 'gray'} variant={item.user_vote === 'like' ? 'solid' : 'outline'} />
              <Text fontWeight="bold" minW="20px" textAlign="center">{item.votes}</Text>
              <IconButton aria-label="dislike" icon={<ThumbsDownIcon />} onClick={() => onVote(item, 'dislike')} size="sm" colorScheme={item.user_vote === 'dislike' ? 'red' : 'gray'} variant={item.user_vote === 'dislike' ? 'solid' : 'outline'} />
            </HStack>
            
            {onWrite && (
              <Button leftIcon={<AddIcon />} colorScheme="green" size="sm" onClick={() => onWrite(item)}>
                {level === 0 ? '이 글에 반박 작성' : '답글 작성'}
              </Button>
            )}
          </Flex>
        </CardBody>
      </Card>
    )
  }

  // 2. 기본 상태 (Compact View)
  return (
    <Card 
      minW="240px" maxW="240px" h="160px"
      cursor="pointer"
      onClick={onSelect}
      variant={isSelected ? 'outline' : 'elevated'}
      borderColor={isSelected ? borderColor : 'transparent'}
      borderWidth={isSelected ? '3px' : '0px'}
      bg="white"
      _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
      transition="all 0.2s"
      position="relative"
    >
      <CardBody p={4} display="flex" flexDirection="column" justifyContent="space-between">
        <VStack align="start" spacing={2} w="full">
          <HStack justify="space-between" w="full">
             <Badge colorScheme={badgeColor} fontSize="0.7em">
                {badgeText}
             </Badge>
             <Menu>
                <MenuButton as={IconButton} icon={<MoreVertIcon />} size="xs" variant="ghost" onClick={(e) => e.stopPropagation()} />
                <Portal>
                  <MenuList onClick={(e) => e.stopPropagation()} zIndex={1400}>
                    {isMyPost ? (
                      <MenuItem icon={<DeleteIcon />} color="red.500" onClick={() => onDelete(item)}>삭제</MenuItem>
                    ) : (
                      <MenuItem icon={<WarningTwoIcon />} onClick={() => onReport(item)}>신고</MenuItem>
                    )}
                  </MenuList>
                </Portal>
             </Menu>
          </HStack>
          
          <Text fontWeight="bold" fontSize={level === 0 ? "md" : "sm"} noOfLines={3} lineHeight="1.4" color="gray.800">
            {item.title || item.content}
          </Text>
        </VStack>
        
        <HStack justify="space-between" w="full" pt={2} align="center">
          <HStack spacing={1} fontSize="xs" color="gray.500">
            <IconButton aria-label="like" icon={<ThumbsUpIcon />} size="xs" variant="ghost" colorScheme={item.user_vote === 'like' ? 'blue' : 'gray'} color={item.user_vote === 'like' ? 'blue.500' : 'gray.400'} onClick={(e) => { e.stopPropagation(); onVote(item, 'like'); }} minW="auto" h="24px" px={1} />
            <Text fontWeight="bold" mr={2}>{item.votes}</Text>
            <IconButton aria-label="dislike" icon={<ThumbsDownIcon />} size="xs" variant="ghost" colorScheme={item.user_vote === 'dislike' ? 'red' : 'gray'} color={item.user_vote === 'dislike' ? 'red.500' : 'gray.400'} onClick={(e) => { e.stopPropagation(); onVote(item, 'dislike'); }} minW="auto" h="24px" px={1} />
            <HStack spacing={0.5} ml={2}>
              <Icon as={ChatIcon} w={3}/>
              <Text>{item.children.length}</Text>
            </HStack>
          </HStack>
          <Text 
            fontSize="xs" color="gray.400" fontWeight="bold" 
            onClick={(e) => { e.stopPropagation(); onDetail(item); }}
            _hover={{ textDecoration: 'underline', color: 'blue.500' }}
          >
            더보기
          </Text>
        </HStack>
      </CardBody>
    </Card>
  )
}

// --- 토론장 한 줄(Row) ---
const DebateRow = ({ 
  level, items, rootType, selectedId, 
  onSelect, onDetail, onVote,
  currentUser, onDelete, onReport, onNavigate, onWrite, onClose 
}: any) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [sortBy, setSortBy] = useState<'likes' | 'comments' | 'new'>('likes')

  const getSortedItems = () => {
    const cloned = [...items]
    return cloned.sort((a: any, b: any) => {
      if (sortBy === 'likes') return b.votes - a.votes
      if (sortBy === 'comments') return b.children.length - a.children.length
      if (sortBy === 'new') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      return 0
    })
  }

  const sortedItems = getSortedItems()
  const selectedItem = sortedItems.find((i: any) => i.id === selectedId)

  // 공통 UI: 헤더
  const RowHeader = () => (
    <HStack mb={2} justify="space-between" px={1}>
        <HStack>
          {level === 0 ? (
            <Heading size="sm" color="gray.700">주장 (Level 0)</Heading>
          ) : (
            <Badge colorScheme={level % 2 === 1 ? 'red' : 'blue'}>
                {level % 2 === 1 ? '반박 (Level 1)' : `재${'재'.repeat(level-1)}반박 (Level ${level})`}
            </Badge>
          )}
          <Text fontSize="xs" color="gray.500">Total: {items.length}</Text>
        </HStack>
        <HStack spacing={1}>
            <Button size="xs" variant={sortBy==='likes'?'solid':'ghost'} colorScheme="gray" onClick={()=>setSortBy('likes')}>좋아요순</Button>
            <Button size="xs" variant={sortBy==='comments'?'solid':'ghost'} colorScheme="gray" onClick={()=>setSortBy('comments')}>댓글순</Button>
            <Button size="xs" variant={sortBy==='new'?'solid':'ghost'} colorScheme="gray" onClick={()=>setSortBy('new')}>최신순</Button>
        </HStack>
    </HStack>
  )

  // 1. 선택된 아이템이 있는 경우 -> [확장된 카드 하나만] 표시 (Level 0 포함 모든 레벨)
  if (selectedItem) {
     return (
       <Box position="relative" py={2}>
         <RowHeader />
         <Box px={1}>
           <DebateCard 
             item={selectedItem} 
             level={level} 
             rootType={rootType} 
             isSelected={true} 
             onSelect={()=>{}} 
             onDetail={onDetail} 
             onVote={onVote}
             currentUser={currentUser} 
             onDelete={onDelete} 
             onReport={onReport}
             onWrite={onWrite} 
             onClose={onClose} 
           />
         </Box>
         <Flex justify="center" h="20px" w="full"><Icon as={ChevronDownIcon} color="gray.300" w={6} h={6} /></Flex>
       </Box>
     )
  }

  // 2. 선택된 아이템이 없는 경우 -> [리스트(가로 스크롤)] 표시
  // 가로 스크롤 함수
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' })
    }
  }

  return (
    <Box position="relative" py={2}>
      <RowHeader />
      <Box position="relative">
        {sortedItems.length > 3 && (
          <IconButton aria-label="l" icon={<ChevronLeftIcon/>} size="sm" isRound pos="absolute" left="-15px" top="50%" transform="translateY(-50%)" zIndex={2} shadow="md" bg="white" onClick={()=>scroll('left')} />
        )}
        <HStack ref={scrollRef} spacing={4} overflowX="auto" py={2} px={1} css={{ '&::-webkit-scrollbar': { display: 'none' } }} align="stretch">
          {sortedItems.map((item: any) => (
            <DebateCard 
              key={item.id} item={item} level={level} rootType={rootType}
              isSelected={false}
              onSelect={() => onSelect(item.id)} onDetail={onDetail} onVote={onVote}
              currentUser={currentUser} onDelete={onDelete} onReport={onReport}
              onWrite={onWrite} onClose={onClose}
            />
          ))}
        </HStack>
        {sortedItems.length > 3 && (
          <IconButton aria-label="r" icon={<ChevronRightIcon/>} size="sm" isRound pos="absolute" right="-15px" top="50%" transform="translateY(-50%)" zIndex={2} shadow="md" bg="white" onClick={()=>scroll('right')} />
        )}
      </Box>
      {selectedId && <Flex justify="center" h="20px" w="full"><Icon as={ChevronDownIcon} color="gray.300" w={6} h={6} /></Flex>}
    </Box>
  )
}

// --- 메인 페이지 ---
export default function DebateDetailPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const router = useRouter()
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()
  
  const [user, setUser] = useState<any>(null)
  const [topic, setTopic] = useState<any>(null)
  const [debateTree, setDebateTree] = useState<DebateNode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [topicId, setTopicId] = useState<string | null>(null)
  
  const [selectedPath, setSelectedPath] = useState<number[]>([])
  const [detailTarget, setDetailTarget] = useState<{id: number, type: 'claim' | 'rebuttal'} | null>(null)

  useEffect(() => {
    setUser(getUser())
    const resolveParams = async () => {
      const resolved = params instanceof Promise ? await params : params
      if (resolved?.id) setTopicId(resolved.id)
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    if (topicId) loadData()
  }, [topicId])

  const loadData = async (isBackground = false) => {
    if (!topicId) return
    const id = parseInt(topicId)
    if (!isBackground) setIsLoading(true)
    try {
      const [topicData, claimsData] = await Promise.all([
        topicsAPI.getTopic(id),
        claimsAPI.getClaims(id, 'best').catch(() => [])
      ])
      setTopic(topicData)
      if (claimsData?.length) {
        const fullTree = await Promise.all(claimsData.map(async (c: any) => {
          const [ev, re] = await Promise.all([
            claimsAPI.getClaimEvidence(c.id).catch(() => []),
            rebuttalsAPI.getRebuttals(c.id).catch(() => [])
          ])
          return {
            id: c.id, nodeType: 'claim', claimType: c.type, title: c.title, content: c.content,
            votes: c.votes, user_vote: c.user_vote, author: c.author,
            children: buildRebuttalTree(re || [], c.type),
            created_at: c.created_at, evidence: ev
          } as DebateNode
        }))
        setDebateTree(fullTree)
        if (fullTree.length > 0 && selectedPath.length === 0) setSelectedPath([fullTree[0].id])
      } else {
        setDebateTree([])
      }
    } catch (e) { console.error(e) } 
    finally { 
      if (!isBackground) setIsLoading(false) 
    }
  }

  const buildRebuttalTree = (items: any[], rootType: 'pro' | 'con'): DebateNode[] => {
    const map = new Map<number, DebateNode>()
    items.forEach((item) => {
      map.set(item.id, { 
        id: item.id, nodeType: 'rebuttal',
        claimType: item.type === 'rebuttal' ? (rootType === 'pro' ? 'con' : 'pro') : (rootType === 'pro' ? 'pro' : 'con'), 
        title: item.title,
        content: item.content, votes: item.votes, user_vote: item.user_vote, author: item.author,
        children: [], created_at: item.created_at, evidence: item.evidence, parent_id: item.parent_id, claim_id: item.claim_id
      })
    })
    const roots: DebateNode[] = []
    items.forEach((item) => {
      const node = map.get(item.id)!
      if (item.parent_id) map.get(item.parent_id)?.children.push(node)
      else roots.push(node)
    })
    return roots
  }

  const handleGoBack = () => {
    if (!topic) { router.back(); return }
    if (topic.topic_type === 'region' || topic.topic_type === 'pledge') { router.push('/debate/region') }
    else { router.push('/debate/topic') }
  }

  const handleSelect = (id: number, level: number) => {
    const newPath = selectedPath.slice(0, level)
    newPath.push(id)
    setSelectedPath(newPath)
  }

  const handleCardClose = (level: number) => {
    setSelectedPath(prev => prev.slice(0, level))
  }

  const handleDetail = (item: DebateNode) => {
    setDetailTarget({ id: item.id, type: item.nodeType })
    onOpen()
  }

  const handleWrite = (item: DebateNode) => {
    onClose()
    if (item.nodeType === 'claim') router.push(`/write?topic_id=${topicId}&type=rebuttal&claim_id=${item.id}`)
    else router.push(`/write?topic_id=${topicId}&type=rebuttal&claim_id=${item.claim_id}&parent_id=${item.id}`)
  }

  const handleDelete = async (item: DebateNode) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    try {
      if (item.nodeType === 'claim') { await claimsAPI.deleteClaim(item.id) }
      else { await rebuttalsAPI.deleteRebuttal(item.id) }
      toast({ title: '삭제되었습니다', status: 'success' })
      if (item.nodeType === 'claim') { router.push('/debate/topic') }
      else { loadData(true); onClose() }
    } catch (e: any) { toast({ title: '삭제 실패', status: 'error' }) }
  }

  const handleReport = async (item: DebateNode) => {
    const reason = prompt('신고 사유를 입력해주세요:')
    if (!reason) return
    try {
      await commonAPI.reportContent(item.nodeType, item.id, reason)
      toast({ title: '신고되었습니다', status: 'success' })
    } catch (e) { toast({ title: '신고 실패', status: 'error' }) }
  }

  const handleVote = async (item: DebateNode, type: 'like' | 'dislike') => {
    try {
      await votesAPI.vote({ [item.nodeType === 'claim' ? 'claim_id' : 'rebuttal_id']: item.id, vote_type: type })
      loadData(true)
    } catch (e) { toast({ title: '오류', status: 'error' }) }
  }

  const getLevelsData = () => {
    const levelsData: DebateNode[][] = []
    levelsData.push(debateTree)
    let currentList = debateTree
    for (const id of selectedPath) {
      const node = currentList.find(n => n.id === id)
      if (node && node.children.length > 0) {
        levelsData.push(node.children)
        currentList = node.children
      } else { break }
    }
    return levelsData
  }

  const detailItem = detailTarget ? findNode(debateTree, detailTarget.id, detailTarget.type) : null
  const levelsData = getLevelsData()
  const selectedRootNode = debateTree.find(n => n.id === selectedPath[0])
  const rootType = selectedRootNode?.claimType || 'pro'

  if (isLoading) return <Box p={10} textAlign="center"><Spinner /></Box>
  if (!topic) return <Box p={10}>주제를 찾을 수 없습니다.</Box>

  return (
    <Box minH="100vh" bg="gray.50" pb={20}>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          <HStack justify="space-between">
            <HStack>
              <IconButton aria-label="back" icon={<ChevronLeftIcon />} onClick={handleGoBack} variant="ghost" />
              <Heading as="h1" size="lg">{topic.title}</Heading>
            </HStack>
            <Button colorScheme="green" onClick={() => router.push(`/write?topic_id=${topicId}&type=claim`)}>새 주장 작성</Button>
          </HStack>
          <Box>
            <VStack align="stretch" spacing={6}>
              {levelsData.map((items, index) => (
                <Box key={index} position="relative">
                  {index > 0 && <Box pos="absolute" top="-24px" left="20px" w="2px" h="24px" bg="gray.200" zIndex={0} />}
                  <DebateRow
                    level={index} items={items} rootType={rootType} selectedId={selectedPath[index] || null}
                    onSelect={(id: number) => handleSelect(id, index)} onDetail={handleDetail} onVote={handleVote}
                    currentUser={user} onDelete={handleDelete} onReport={handleReport}
                    onNavigate={(currentIndex: number) => (dir: 'prev' | 'next') => {
                       const nextIdx = dir === 'prev' ? currentIndex - 1 : currentIndex + 1
                       if (nextIdx >= 0 && nextIdx < debateTree.length) handleSelect(debateTree[nextIdx].id, 0)
                    }}
                    onWrite={handleWrite} 
                    onClose={() => handleCardClose(index)}
                  />
                </Box>
              ))}
            </VStack>
          </Box>
        </VStack>
      </Container>
      <DetailModal isOpen={isOpen} onClose={onClose} item={detailItem} currentUser={user} onDelete={handleDelete} onReport={handleReport} onWrite={handleWrite} onVote={handleVote} />
    </Box>
  )
}