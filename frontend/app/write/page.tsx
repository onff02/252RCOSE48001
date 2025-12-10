'use client'

import { useState, useEffect, Suspense } from 'react' // Suspense 추가
import {
  Box, Container, Heading, FormControl, FormLabel, Input, Textarea, Button, VStack,
  useToast, HStack, Text, Card, CardBody, Alert, AlertIcon, Spinner
} from '@chakra-ui/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { claimsAPI, rebuttalsAPI, aiAPI } from '@/lib/api' // topicsAPI 제거 또는 필요시 유지

function WriteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const toast = useToast()

  // 쿼리 파라미터 확인
  const type = searchParams.get('type') || 'claim' // 'topic' | 'claim' | 'rebuttal'
  const topicId = searchParams.get('topic_id')
  const claimId = searchParams.get('claim_id')
  const parentId = searchParams.get('parent_id')

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [claimType, setClaimType] = useState('pro') // pro/con (주장용)
  const [evidenceList, setEvidenceList] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAiSearching, setIsAiSearching] = useState(false)

  // [수정] 페이지 진입 시 유효성 검사 및 타입 설정
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

  // [수정] AI 근거 찾기
  const handleAiSearch = async () => {
    if (content.length < 100) {
      toast({ title: '글자 수 부족', description: '본문을 100자 이상 작성해야 AI 기능을 사용할 수 있습니다.', status: 'warning' })
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

  // [수정] 글 제출
  const handleSubmit = async () => {
    // 1. 글자 수 체크 (제출 자체는 막지 않지만, AI 기능 유도)
    if (content.length < 10) {
      toast({ title: '내용 부족', description: '내용을 더 작성해주세요.', status: 'warning' })
      return
    }
    // 2. [필수] 근거 포함 여부 체크
    if (evidenceList.length === 0) {
      toast({ title: '근거 필요', description: '주장/반박에는 최소 1개 이상의 근거가 필요합니다. "AI 근거 찾기"를 이용해보세요.', status: 'error', duration: 5000 })
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
          content, // 반박은 제목 없음, 내용만
          type: parentId ? 'counter' : 'rebuttal'
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
    <Container maxW="container.md" py={10}>
      <Card shadow="lg">
        <CardBody>
          <VStack spacing={6} align="stretch">
            <Heading size="lg">
              {type === 'claim' ? '새 주장 작성' : type === 'rebuttal' ? '새 반박 작성' : '글 작성'}
            </Heading>

            {/* 안내 메시지 */}
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Box>
                <Text fontWeight="bold">논리적인 글쓰기 규칙</Text>
                <Text fontSize="sm">- 본문은 최소 100자 이상 작성해야 AI 도구를 사용할 수 있습니다.</Text>
                <Text fontSize="sm">- 반드시 1개 이상의 근거를 첨부해야 등록이 가능합니다.</Text>
              </Box>
            </Alert>

            {/* 제목 (주장일 때만) */}
            {type === 'claim' && (
              <FormControl>
                <FormLabel>제목</FormLabel>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="주장의 핵심을 요약해주세요" />
              </FormControl>
            )}

            {/* 찬반 선택 (주장일 때만) */}
            {type === 'claim' && (
              <HStack w="full" bg="gray.100" p={1} borderRadius="md">
                <Button flex={1} colorScheme={claimType === 'pro' ? 'blue' : 'gray'} onClick={() => setClaimType('pro')}>찬성 (Pro)</Button>
                <Button flex={1} colorScheme={claimType === 'con' ? 'red' : 'gray'} onClick={() => setClaimType('con')}>반대 (Con)</Button>
              </HStack>
            )}

            <FormControl>
              <FormLabel>본문</FormLabel>
              <Textarea 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                placeholder={content.length === 0 ? "논리적 근거를 포함해서 글을 작성해주세요. (100자 이상 권장)" : ""} 
                minH="200px" 
              />
              <Text textAlign="right" fontSize="xs" color={content.length < 100 ? 'red.500' : 'green.500'}>
                {content.length} / 100자 (최소 권장)
              </Text>
            </FormControl>

            {/* AI 도구 버튼 */}
            <HStack>
              <Button colorScheme="purple" onClick={handleAiSearch} isLoading={isAiSearching} size="sm">
                🤖 AI 근거 찾기
              </Button>
              <Button colorScheme="teal" onClick={() => {
                 if(content.length < 100) toast({title:'100자 미만', status:'warning'});
                 else toast({title:'준비 중', description:'글 다듬기 기능은 준비 중입니다.'});
              }} size="sm">
                ✨ AI 글 다듬기
              </Button>
            </HStack>

            {/* 근거 목록 */}
            <Box>
              <Text fontWeight="bold" mb={2}>첨부된 근거 ({evidenceList.length})</Text>
              {evidenceList.length > 0 ? (
                <VStack align="stretch" spacing={2} p={4} bg="gray.50" borderRadius="md">
                  {evidenceList.map((ev, i) => (
                    <Text key={i} fontSize="sm">✅ {ev.source || '출처'}: {ev.text?.substring(0, 50)}...</Text>
                  ))}
                </VStack>
              ) : (
                <Text fontSize="sm" color="gray.500">아직 첨부된 근거가 없습니다. AI 근거 찾기를 이용해보세요.</Text>
              )}
            </Box>

            <HStack justify="end" pt={4}>
              {/* [수정] 취소 시 이전 페이지로 */}
              <Button variant="ghost" onClick={() => router.back()}>취소</Button>
              <Button colorScheme="blue" onClick={handleSubmit} isLoading={isSubmitting}>등록하기</Button>
            </HStack>
          </VStack>
        </CardBody>
      </Card>
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