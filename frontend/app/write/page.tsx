'use client'

import { useState, useEffect, Suspense } from 'react'
import {
  Box, Container, Heading, FormControl, FormLabel, Input, Textarea, Button, VStack,
  useToast, HStack, Text, Alert, AlertIcon, Spinner, IconButton,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, useDisclosure,
  Link as ChakraLink, Card, CardBody, Badge, Icon, Flex
} from '@chakra-ui/react'
import { CheckIcon, CloseIcon, DeleteIcon, AddIcon, ExternalLinkIcon, EditIcon } from '@chakra-ui/icons'
import { useRouter, useSearchParams } from 'next/navigation'
import { claimsAPI, rebuttalsAPI, aiAPI } from '@/lib/api'

function WriteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const toast = useToast()
  
  const { isOpen, onOpen, onClose } = useDisclosure()

  // 쿼리 파라미터 확인
  const type = searchParams.get('type') || 'claim'
  const topicId = searchParams.get('topic_id')
  const claimId = searchParams.get('claim_id')
  const parentId = searchParams.get('parent_id')

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [claimType, setClaimType] = useState('pro')
  const [evidenceList, setEvidenceList] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // AI 로딩 상태
  const [isAiSearching, setIsAiSearching] = useState(false)
  const [isAiImproving, setIsAiImproving] = useState(false)

  // 직접 추가할 근거 입력 상태
  const [manualSource, setManualSource] = useState('')
  const [manualText, setManualText] = useState('')
  const [manualUrl, setManualUrl] = useState('')

  useEffect(() => {
    if (type === 'claim' && !topicId) {
      toast({ title: '오류', description: '토론 주제 정보가 없습니다.', status: 'error' })
      router.back()
    }
    if (type === 'rebuttal' && !claimId) {
      toast({ title: '오류', description: '대상 주장 정보가 없습니다.', status: 'error' })
      router.back()
    }
  }, [type, topicId, claimId, router, toast])

  // AI 근거 찾기
  const handleAiSearch = async () => {
    if (content.length < 50) {
      toast({ title: '글자 수 부족', description: '본문을 50자 이상 작성해야 AI가 문맥을 파악할 수 있습니다.', status: 'warning' })
      return
    }
    setIsAiSearching(true)
    try {
      const result = await aiAPI.searchEvidence(content)
      if (result.evidence && result.evidence.length > 0) {
        setEvidenceList([...evidenceList, ...result.evidence])
        toast({ title: '성공', description: `${result.evidence.length}개의 근거를 찾았습니다.`, status: 'success' })
      } else {
        toast({ title: '알림', description: '적절한 근거를 찾지 못했습니다.', status: 'info' })
      }
    } catch (e) {
      toast({ title: '오류', status: 'error', description: 'AI 검색 중 오류 발생' })
    } finally {
      setIsAiSearching(false)
    }
  }

  // [기능 추가] AI 글 다듬기
  const handleAiImprove = async () => {
    if (content.length < 30) {
      toast({ title: '내용 부족', description: '글을 조금 더 작성한 후 다듬기 기능을 사용해주세요.', status: 'warning' })
      return
    }
    setIsAiImproving(true)
    try {
      const result = await aiAPI.improveText(content)
      if (result.improved_text) {
        setContent(result.improved_text)
        toast({ title: '완료', description: 'AI가 글을 더 논리적으로 다듬었습니다.', status: 'success' })
      }
    } catch (e) {
      toast({ title: '오류', description: '글 다듬기 중 문제가 발생했습니다.', status: 'error' })
    } finally {
      setIsAiImproving(false)
    }
  }

  const handleRemoveEvidence = (indexToRemove: number) => {
    setEvidenceList(evidenceList.filter((_, index) => index !== indexToRemove))
  }

  const handleAddManualEvidence = () => {
    if (!manualSource || !manualText || !manualUrl) {
      toast({ title: '입력 부족', description: '출처, 내용, URL을 모두 입력해주세요.', status: 'warning' })
      return
    }
    
    if (!manualUrl.startsWith('http')) {
       toast({ title: 'URL 형식 오류', description: 'URL은 http:// 또는 https:// 로 시작해야 합니다.', status: 'warning' })
       return
    }

    const newEvidence = {
      source: manualSource,
      text: manualText,
      publisher: '사용자 직접 입력',
      url: manualUrl
    }
    setEvidenceList([...evidenceList, newEvidence])
    
    setManualSource('')
    setManualText('')
    setManualUrl('')
    onClose()
    toast({ title: '추가 완료', description: '근거가 목록에 추가되었습니다.', status: 'success' })
  }

  const handleSubmit = async () => {
    // 1. [기능 추가] 제목 필수 체크 (주장일 경우)
    if (type === 'claim' && !title.trim()) {
        toast({ title: '제목 필수', description: '주장의 제목을 입력해주세요.', status: 'error' })
        return
    }

    if (content.length < 50) {
      toast({ title: '내용 부족', description: '내용을 50자 이상 작성해주세요.', status: 'warning' })
      return
    }
    if (evidenceList.length === 0) {
      toast({ title: '근거 필요', description: '최소 1개 이상의 근거가 필요합니다.', status: 'error', duration: 5000 })
      return
    }

    setIsSubmitting(true)
    try {
      if (type === 'claim') {
        await claimsAPI.createClaim({
          topic_id: parseInt(topicId!),
          title,
          content,
          type: claimType,
          evidence: evidenceList
        })
        router.push(`/debate/topic/${topicId}`)
      } else if (type === 'rebuttal') {
        await rebuttalsAPI.createRebuttal({
          claim_id: parseInt(claimId!),
          parent_id: parentId ? parseInt(parentId) : undefined,
          title,
          content, 
          type: parentId ? 'counter' : 'rebuttal',
          evidence: evidenceList
        })
        router.push(`/debate/topic/${topicId}`)
      }
      toast({ title: '등록 완료', status: 'success' })
    } catch (e: any) {
      toast({ title: '오류', description: e.message, status: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Container maxW="container.lg" py={10}>
      <Box bg="white" p={8} borderRadius="2xl" boxShadow="sm">
        <VStack spacing={6} align="stretch">
          <Heading size="lg">
            {type === 'claim' ? '새 주장 작성' : type === 'rebuttal' ? '새 반박 작성' : '글 작성'}
          </Heading>

          <Alert status="info" borderRadius="md" variant="subtle">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold" fontSize="sm">논리적인 글쓰기 규칙</Text>
              <Text fontSize="xs" color="gray.600">- 본문은 50자 이상, 근거는 1개 이상 필수입니다.</Text>
            </Box>
          </Alert>

          {type === 'claim' && (
            <Box>
              <FormLabel mb={2}>입장 선택</FormLabel>
              <HStack w="full" bg="gray.50" p={1.5} borderRadius="xl" spacing={2}>
                <Button 
                  flex={1} size="lg" borderRadius="lg"
                  leftIcon={claimType === 'pro' ? <CheckIcon /> : undefined}
                  colorScheme="blue"
                  variant={claimType === 'pro' ? 'solid' : 'ghost'}
                  onClick={() => setClaimType('pro')}
                >
                  찬성 (Pro)
                </Button>
                <Button 
                  flex={1} size="lg" borderRadius="lg"
                  leftIcon={claimType === 'con' ? <CloseIcon /> : undefined}
                  colorScheme="red"
                  variant={claimType === 'con' ? 'solid' : 'ghost'}
                  onClick={() => setClaimType('con')}
                >
                  반대 (Con)
                </Button>
              </HStack>
            </Box>
          )}

          <FormControl isRequired>
            <FormLabel>제목</FormLabel>
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="핵심을 요약해주세요" 
              size="lg"
              focusBorderColor="brand.500"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>본문</FormLabel>
            <Textarea 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
              placeholder="논리적 근거를 포함해서 글을 작성해주세요." 
              minH="250px" 
              focusBorderColor="brand.500"
            />
            <HStack justify="space-between" mt={1}>
                <HStack>
                    <Button 
                        size="xs" 
                        leftIcon={<EditIcon />} 
                        colorScheme="teal" 
                        variant="solid" 
                        onClick={handleAiImprove}
                        isLoading={isAiImproving}
                        loadingText="다듬는 중..."
                    >
                        AI 글 다듬기
                    </Button>
                </HStack>
                <Text fontSize="xs" color={content.length < 50 ? 'red.500' : 'green.500'}>
                    {content.length} / 50자 (최소)
                </Text>
            </HStack>
          </FormControl>

          <HStack wrap="wrap" pt={2} pb={4} borderBottom="1px solid" borderColor="gray.100">
            <Button colorScheme="purple" onClick={handleAiSearch} isLoading={isAiSearching} size="sm" leftIcon={<Icon as={ExternalLinkIcon} />}>
              AI 근거 찾기
            </Button>
            <Button leftIcon={<AddIcon />} size="sm" variant="outline" onClick={onOpen} colorScheme="gray">
              직접 근거 추가
            </Button>
          </HStack>

          {/* [디자인 수정] 근거 목록 - 카드 스타일 */}
          <Box>
            <Text fontWeight="bold" mb={3} fontSize="md">첨부된 근거 ({evidenceList.length})</Text>
            {evidenceList.length > 0 ? (
              <VStack align="stretch" spacing={3}>
                {evidenceList.map((ev, i) => (
                  <Card key={i} variant="outline" size="sm" borderRadius="md" _hover={{ borderColor: 'blue.300', bg: 'blue.50' }} transition="all 0.2s">
                    <CardBody>
                        <HStack justify="space-between" align="start">
                            <HStack align="start" spacing={3} flex={1}>
                                <Icon as={CheckIcon} color="green.500" mt={1} />
                                <VStack align="start" spacing={1} flex={1}>
                                    <Text fontWeight="bold" fontSize="sm" color="gray.800">
                                        {ev.source || '출처 미상'}
                                    </Text>
                                    <Text fontSize="xs" color="gray.600" noOfLines={2}>
                                        {ev.text}
                                    </Text>
                                    {ev.url && (
                                        <ChakraLink href={ev.url} isExternal fontSize="xs" color="blue.500" noOfLines={1} display="flex" alignItems="center">
                                            <ExternalLinkIcon mx="2px" /> {ev.url}
                                        </ChakraLink>
                                    )}
                                </VStack>
                            </HStack>
                            <IconButton
                                aria-label="근거 삭제"
                                icon={<DeleteIcon />}
                                size="xs"
                                colorScheme="red"
                                variant="ghost"
                                onClick={() => handleRemoveEvidence(i)}
                            />
                        </HStack>
                    </CardBody>
                  </Card>
                ))}
              </VStack>
            ) : (
              <Flex 
                p={8} 
                border="1px dashed" 
                borderColor="gray.300" 
                borderRadius="lg" 
                justify="center" 
                align="center" 
                bg="gray.50"
                direction="column"
              >
                <Text fontSize="sm" color="gray.500">아직 첨부된 근거가 없습니다.</Text>
                <Text fontSize="xs" color="gray.400" mt={1}>AI 근거 찾기나 직접 추가를 이용해보세요.</Text>
              </Flex>
            )}
          </Box>

          <HStack justify="end" pt={4}>
            <Button variant="ghost" size="lg" onClick={() => router.back()}>취소</Button>
            <Button colorScheme="brand" size="lg" onClick={handleSubmit} isLoading={isSubmitting}>
              등록하기
            </Button>
          </HStack>
        </VStack>
      </Box>

      {/* 직접 근거 추가 모달 */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>근거 직접 추가</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>출처 (제목 또는 발행처)</FormLabel>
                <Input 
                  value={manualSource} 
                  onChange={(e) => setManualSource(e.target.value)} 
                  placeholder="예: 통계청 2024년 보고서"
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>URL (링크)</FormLabel>
                <Input 
                  value={manualUrl} 
                  onChange={(e) => setManualUrl(e.target.value)} 
                  placeholder="https://..."
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>내용 요약</FormLabel>
                <Textarea 
                  value={manualText} 
                  onChange={(e) => setManualText(e.target.value)} 
                  placeholder="주장을 뒷받침할 핵심 내용을 입력하세요"
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>취소</Button>
            <Button colorScheme="blue" onClick={handleAddManualEvidence}>추가하기</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </Container>
  )
}

export default function WritePage() {
  return (
    <Suspense fallback={<Box p={10} textAlign="center"><Spinner /></Box>}>
      <WriteContent />
    </Suspense>
  )
}