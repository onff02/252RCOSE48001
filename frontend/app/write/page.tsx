'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Box,
  Container,
  Heading,
  Button,
  VStack,
  HStack,
  Text,
  Textarea,
  FormControl,
  FormLabel,
  Input,
  Card,
  CardBody,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  useDisclosure,
  Select,
  Divider,
  useToast,
} from '@chakra-ui/react'
import Link from 'next/link'
import { topicsAPI, claimsAPI, aiAPI } from '@/lib/api'

export default function WritePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [showAISuggestion, setShowAISuggestion] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSearchingEvidence, setIsSearchingEvidence] = useState(false)
  const [isImprovingText, setIsImprovingText] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState('')
  const [topicId, setTopicId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    topic: '',
    title: '',
    content: '',
    type: 'pro',
    category: '',
  })
  const [evidenceList, setEvidenceList] = useState<Array<{ id: number; source: string; publisher: string; text?: string; url?: string }>>([])
  const [newEvidence, setNewEvidence] = useState({ source: '', publisher: '', text: '' })

  useEffect(() => {
    const topicIdParam = searchParams.get('topic_id')
    if (topicIdParam) {
      const id = parseInt(topicIdParam)
      if (!isNaN(id)) {
        setTopicId(id)
        // 주제 정보 가져오기
        topicsAPI.getTopic(id)
          .then((topic) => {
            setFormData(prev => ({ ...prev, topic: topic.title }))
          })
          .catch(() => {})
      }
    }
  }, [searchParams])

  const handleAddEvidence = () => {
    if (newEvidence.source && newEvidence.publisher) {
      setEvidenceList([
        ...evidenceList,
        { id: evidenceList.length + 1, source: newEvidence.source, publisher: newEvidence.publisher, text: newEvidence.text },
      ])
      setNewEvidence({ source: '', publisher: '', text: '' })
      onClose()
    }
  }

  const handleDeleteEvidence = (id: number) => {
    setEvidenceList(evidenceList.filter(ev => ev.id !== id))
  }

  const handleSubmit = async () => {
    if (!formData.title || !formData.content) {
      toast({
        title: '오류',
        description: '제목과 본문을 입력해주세요.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    if (evidenceList.length === 0) {
      toast({
        title: '오류',
        description: '최소 1개 이상의 근거를 추가해주세요.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsSubmitting(true)
    try {
      let finalTopicId = topicId

      // 주제가 없으면 새로 생성
      if (!finalTopicId && formData.topic) {
        const newTopic = await topicsAPI.createTopic({
          title: formData.topic,
          category: formData.category || undefined,
          topic_type: 'topic',
        })
        finalTopicId = newTopic.id
      }

      if (!finalTopicId) {
        throw new Error('주제를 선택하거나 입력해주세요.')
      }

      // 주장 생성
      const evidence = evidenceList.map(ev => ({
        source: ev.source,
        publisher: ev.publisher,
        text: ev.text || '',
      }))

      await claimsAPI.createClaim({
        topic_id: finalTopicId,
        title: formData.title,
        content: formData.content,
        type: formData.type,
        evidence,
      })

      toast({
        title: '성공',
        description: '글이 게시되었습니다.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })

      router.push(`/debate/topic/${finalTopicId}`)
    } catch (error: any) {
      toast({
        title: '오류',
        description: error.message || '글 게시에 실패했습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAISearch = async () => {
    if (!formData.title && !formData.content) {
      toast({
        title: '오류',
        description: '제목 또는 본문을 입력해주세요.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsSearchingEvidence(true)
    try {
      // 제목과 본문을 조합하여 검색 쿼리 생성
      const searchQuery = `${formData.topic || ''} ${formData.title} ${formData.content}`.trim()
      
      const response = await aiAPI.searchEvidence(searchQuery, 'advanced')
      
      // 검색된 근거를 evidenceList에 추가
      const newEvidenceItems = response.evidence.map((ev, index) => ({
        id: evidenceList.length + index + 1,
        source: ev.source || ev.publisher || '출처 없음',
        publisher: ev.publisher || ev.url || '출처 없음',
        text: ev.text || '',
        url: ev.url || '',
      }))
      
      setEvidenceList([...evidenceList, ...newEvidenceItems])
      
      toast({
        title: '성공',
        description: `${newEvidenceItems.length}개의 근거를 찾았습니다.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error: any) {
      toast({
        title: '오류',
        description: error.message || '근거 검색에 실패했습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsSearchingEvidence(false)
    }
  }

  const handleAIRevise = async () => {
    if (!formData.content) {
      toast({
        title: '오류',
        description: '본문을 입력해주세요.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsImprovingText(true)
    try {
      const response = await aiAPI.improveText(formData.content, formData.title)
      setAiSuggestion(response.improved_text)
      setShowAISuggestion(true)
    } catch (error: any) {
      toast({
        title: '오류',
        description: error.message || '글 수정에 실패했습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsImprovingText(false)
    }
  }

  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          <HStack justify="space-between">
            <Heading as="h1" size="xl">
              글 작성
            </Heading>
            <Link href="/debate/topic">
              <Button variant="outline">취소</Button>
            </Link>
          </HStack>

          <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>주제</FormLabel>
                <Input
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  placeholder="주제를 입력하세요 (예: 10.15 부동산 대책... 효과 있을까?)"
                  isDisabled={!!topicId}
                />
                {topicId && (
                  <Text fontSize="sm" color="gray.600" mt={1}>
                    기존 주제에 주장을 추가합니다.
                  </Text>
                )}
              </FormControl>

              {!topicId && (
                <FormControl>
                  <FormLabel>카테고리</FormLabel>
                  <Select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="카테고리를 선택하세요"
                  >
                    <option value="politics">정치</option>
                    <option value="economy">경제</option>
                    <option value="society">사회</option>
                    <option value="culture">문화</option>
                    <option value="it">IT</option>
                    <option value="world">세계</option>
                  </Select>
                </FormControl>
              )}

              <FormControl>
                <FormLabel>제목</FormLabel>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="주장의 제목을 입력하세요"
                />
              </FormControl>

              <FormControl>
                <FormLabel>의견 유형</FormLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="pro">찬성</option>
                  <option value="con">반대</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>본문</FormLabel>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="논리적 근거를 포함하여 글을 작성하세요"
                  minH="300px"
                />
              </FormControl>

              <HStack>
                <Button 
                  colorScheme="blue" 
                  onClick={handleAISearch}
                  isLoading={isSearchingEvidence}
                  loadingText="검색 중..."
                >
                  AI 근거 찾기
                </Button>
                <Button 
                  colorScheme="green" 
                  onClick={handleAIRevise}
                  isLoading={isImprovingText}
                  loadingText="수정 중..."
                >
                  AI 글 수정 (다듬기)
                </Button>
              </HStack>

              {showAISuggestion && (
                <Card bg="blue.50" border="2px solid" borderColor="blue.200">
                  <CardBody>
                    <VStack align="stretch" spacing={2}>
                      <Text fontWeight="bold" color="blue.700">
                        이렇게 수정해 드릴까요?
                      </Text>
                      <Text>{aiSuggestion}</Text>
                      <HStack>
                        <Button size="sm" colorScheme="blue" onClick={() => {
                          setFormData({ ...formData, content: aiSuggestion })
                          setShowAISuggestion(false)
                        }}>
                          적용하기
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setShowAISuggestion(false)}>
                          취소
                        </Button>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              )}
            </VStack>
          </Box>

          <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <Heading as="h2" size="md">
                  근거 편집 기능
                </Heading>
                <Button size="sm" colorScheme="blue" onClick={onOpen}>
                  근거 추가
                </Button>
              </HStack>

              <HStack>
                <Text fontSize="sm" color="gray.600">
                  글에서 사용된 자료
                </Text>
                <Text fontSize="sm" color="red.500" fontWeight="bold">
                  (필수: 최소 1개 이상)
                </Text>
              </HStack>

              <VStack spacing={3} align="stretch">
                {evidenceList.map((evidence) => (
                  <Card 
                    key={evidence.id} 
                    _hover={{ boxShadow: 'md', cursor: evidence.url ? 'pointer' : 'default' }}
                    onClick={evidence.url ? () => window.open(evidence.url, '_blank', 'noopener,noreferrer') : undefined}
                  >
                    <CardBody>
                      <HStack justify="space-between" align="start">
                        <VStack align="start" spacing={2} flex={1}>
                          <HStack>
                            <Text as="span" fontWeight="bold" fontSize="sm" color="blue.600">
                              {evidence.id}.
                            </Text>
                            {evidence.url ? (
                              <Text
                                as="a"
                                href={evidence.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                fontWeight="bold"
                                fontSize="md"
                                color="blue.600"
                                _hover={{ color: 'blue.800', textDecoration: 'underline' }}
                                cursor="pointer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {evidence.source}
                              </Text>
                            ) : (
                              <Text fontWeight="bold" fontSize="md">
                                {evidence.source}
                              </Text>
                            )}
                          </HStack>
                          {evidence.publisher && evidence.publisher !== evidence.source && (
                            <Text fontSize="sm" color="gray.600" pl={6}>
                              출처: {evidence.publisher}
                            </Text>
                          )}
                          {evidence.text && (
                            <Text fontSize="sm" color="gray.700" pl={6} noOfLines={3}>
                              {evidence.text.length > 100 ? `${evidence.text.substring(0, 100)}...` : evidence.text}
                            </Text>
                          )}
                          {evidence.url && (
                            <Text fontSize="xs" color="gray.500" pl={6}>
                              {evidence.url}
                            </Text>
                          )}
                        </VStack>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          colorScheme="red" 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteEvidence(evidence.id)
                          }}
                        >
                          삭제
                        </Button>
                      </HStack>
                    </CardBody>
                  </Card>
                ))}
              </VStack>
            </VStack>
          </Box>

          <HStack justify="flex-end">
            <Button variant="outline" onClick={() => router.back()}>취소</Button>
            <Button 
              colorScheme="blue" 
              onClick={handleSubmit}
              isLoading={isSubmitting}
              loadingText="게시 중..."
              isDisabled={evidenceList.length === 0}
              title={evidenceList.length === 0 ? '최소 1개 이상의 근거를 추가해주세요' : ''}
            >
              게시하기
            </Button>
          </HStack>
        </VStack>
      </Container>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>근거 추가</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>근거 내용</FormLabel>
                <Input
                  value={newEvidence.source}
                  onChange={(e) => setNewEvidence({ ...newEvidence, source: e.target.value })}
                  placeholder="근거 내용을 입력하세요"
                />
              </FormControl>
              <FormControl>
                <FormLabel>출처</FormLabel>
                <Input
                  value={newEvidence.publisher}
                  onChange={(e) => setNewEvidence({ ...newEvidence, publisher: e.target.value })}
                  placeholder="출처를 입력하세요 (예: 연합뉴스)"
                />
              </FormControl>
              <FormControl>
                <FormLabel>근거 텍스트 (선택)</FormLabel>
                <Textarea
                  value={newEvidence.text}
                  onChange={(e) => setNewEvidence({ ...newEvidence, text: e.target.value })}
                  placeholder="근거에 대한 설명을 입력하세요"
                  size="sm"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              취소
            </Button>
            <Button colorScheme="blue" onClick={handleAddEvidence}>
              추가
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

