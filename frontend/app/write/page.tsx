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
import { topicsAPI, claimsAPI } from '@/lib/api'

export default function WritePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [showAISuggestion, setShowAISuggestion] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [topicId, setTopicId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    topic: '',
    title: '',
    content: '',
    type: 'pro',
    category: '',
  })
  const [evidenceList, setEvidenceList] = useState<Array<{ id: number; source: string; publisher: string; text?: string }>>([])
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

  const handleAISearch = () => {
    // TODO: AI 근거 찾기 API 호출
    alert('AI가 근거를 검색하고 있습니다...')
  }

  const handleAIRevise = () => {
    // TODO: AI 글 수정 API 호출
    setShowAISuggestion(true)
  }

  const aiSuggestion = '이러한 이유로 10.15 부동산 대책은 효과적일 것입니다. 공급 확대와 투기 억제를 통해 시장 안정을 가져올 수 있습니다.'

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
                <Button colorScheme="blue" onClick={handleAISearch}>
                  AI 근거 찾기
                </Button>
                <Button colorScheme="green" onClick={handleAIRevise}>
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

              <Text fontSize="sm" color="gray.600">
                글에서 사용된 자료
              </Text>

              <VStack spacing={2} align="stretch">
                {evidenceList.map((evidence) => (
                  <Card key={evidence.id}>
                    <CardBody>
                      <HStack justify="space-between">
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="bold">{evidence.id}. {evidence.source}</Text>
                          <Text fontSize="sm" color="gray.600">
                            - {evidence.publisher}
                          </Text>
                        </VStack>
                        <Button size="sm" variant="ghost" colorScheme="red" onClick={() => handleDeleteEvidence(evidence.id)}>
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

