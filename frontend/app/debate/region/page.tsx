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
  Select,
  Card,
  CardBody,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner,
  useToast,
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
  useDisclosure
} from '@chakra-ui/react'
import Link from 'next/link'
import { topicsAPI } from '@/lib/api'
import { getUser } from '@/lib/auth'
import UserInfo from '@/components/UserInfo'

const regions = {
  seoul: {
    name: '서울',
    districts: ['서울 전체', '강동구', '강북구', '강남구', '강서구', '관악구', '광진구', '구로구', '금천구', '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'],
  },
  gyeonggi: {
    name: '경기',
    districts: ['경기 전체', '고양시', '수원시', '성남시', '부천시', '안양시', '안산시', '평택시', '시흥시', '김포시', '광명시', '이천시', '오산시', '구리시', '안성시', '포천시', '의정부시', '하남시', '용인시', '파주시', '양주시', '광주시', '양평군', '여주시', '연천군', '가평군'],
  },
  gangwon: {
    name: '강원',
    districts: ['강원 전체', '춘천시', '원주시', '강릉시', '동해시', '태백시', '속초시', '삼척시', '홍천군', '횡성군', '영월군', '평창군', '정선군', '철원군', '화천군', '양구군', '인제군', '고성군', '양양군'],
  },
}

export default function RegionDebatePage() {
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()
  
  const [selectedRegion, setSelectedRegion] = useState('seoul')
  const [selectedDistrict, setSelectedDistrict] = useState('서울 전체')
  const [activeTab, setActiveTab] = useState(0)
  const [topics, setTopics] = useState<any[]>([])
  const [pledges, setPledges] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  // 주제 생성용 상태
  const [newTopicTitle, setNewTopicTitle] = useState('')
  const [createRegion, setCreateRegion] = useState('seoul')
  const [createDistrict, setCreateDistrict] = useState('서울 전체')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    setUser(getUser())
  }, [])

  useEffect(() => {
    loadData()
  }, [selectedRegion, selectedDistrict, activeTab])

  // 모달이 열릴 때 기본값 설정
  useEffect(() => {
    if (isOpen) {
      setCreateRegion(selectedRegion)
      setCreateDistrict(selectedDistrict)
    }
  }, [isOpen, selectedRegion, selectedDistrict])

  const loadData = async () => {
    setIsLoading(true)
    try {
      if (activeTab === 0) {
        // 지역 현안
        const regionName = regions[selectedRegion as keyof typeof regions].name
        const district = selectedDistrict === `${regionName} 전체` || selectedDistrict === '서울 전체' || selectedDistrict === '경기 전체' || selectedDistrict === '강원 전체'
          ? undefined 
          : selectedDistrict
        const data = await topicsAPI.getTopics(
          undefined,
          selectedRegion,
          district,
          'region'
        )
        setTopics(data)
      } else {
        // 공약 토론
        const regionName = regions[selectedRegion as keyof typeof regions].name
        const district = selectedDistrict === `${regionName} 전체` || selectedDistrict === '서울 전체' || selectedDistrict === '경기 전체' || selectedDistrict === '강원 전체'
          ? undefined
          : selectedDistrict
        const data = await topicsAPI.getTopics(
          undefined,
          selectedRegion,
          district,
          'pledge'
        )
        setPledges(data)
      }
    } catch (error: any) {
      toast({
        title: '오류',
        description: error.message || '데이터를 불러오는데 실패했습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      setTopics([])
      setPledges([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTopic = async () => {
    if (!newTopicTitle.trim()) {
      toast({ title: '입력 오류', description: '주제명을 입력해주세요.', status: 'warning' })
      return
    }
    setIsCreating(true)
    try {
      const type = activeTab === 0 ? 'region' : 'pledge'
      
      await topicsAPI.createTopic({
        title: newTopicTitle,
        region: createRegion,
        district: createDistrict,
        topic_type: type
      })
      
      toast({ title: '생성 완료', description: '새로운 지역 토론 주제가 생성되었습니다.', status: 'success' })
      onClose()
      setNewTopicTitle('')
      loadData()
    } catch (error: any) {
      toast({ title: '생성 실패', description: error.message || '오류가 발생했습니다.', status: 'error' })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          <HStack justify="space-between">
            <Heading as="h1" size="xl">
              우리 동네 토론 게시판
            </Heading>
            
            <HStack spacing={2}>
              <UserInfo />
              {user && user.username === 'admin' && (
                <Button colorScheme="green" onClick={onOpen}>토론 주제 생성</Button>
              )}
            </HStack>
          </HStack>

          <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
            <VStack spacing={4} align="stretch">
              <Text fontWeight="bold" fontSize="lg">
                지역 선택
              </Text>
              <HStack spacing={4}>
                <Select
                  value={selectedRegion}
                  onChange={(e) => {
                    setSelectedRegion(e.target.value)
                    const firstDistrict = regions[e.target.value as keyof typeof regions].districts[0]
                    setSelectedDistrict(firstDistrict)
                  }}
                  maxW="200px"
                >
                  {Object.entries(regions).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.name}
                    </option>
                  ))}
                </Select>
                <Select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  maxW="200px"
                >
                  {regions[selectedRegion as keyof typeof regions].districts.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </Select>
              </HStack>
              <Text fontSize="sm" color="gray.600">
                선택된 지역: {regions[selectedRegion as keyof typeof regions].name} {selectedDistrict === `${regions[selectedRegion as keyof typeof regions].name} 전체` ? '' : selectedDistrict}
              </Text>
            </VStack>
          </Box>

          <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
            <Tabs index={activeTab} onChange={setActiveTab}>
              <TabList>
                <Tab>지역 현안</Tab>
                <Tab>공약 토론</Tab>
              </TabList>

              <TabPanels>
                <TabPanel>
                  <VStack spacing={3} align="stretch">
                    <HStack justify="space-between" mb={4}>
                      <Heading as="h2" size="md">
                        지역 문제 토론
                      </Heading>
                      <HStack spacing={2}>
                        <Button size="sm" variant="outline">Best</Button>
                        <Button size="sm" variant="outline">Trend</Button>
                        <Button size="sm" variant="outline">New</Button>
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
                      topics.map((topic) => (
                        // [수정] 카드 전체 Link 적용 및 버튼 제거
                        <Link href={`/debate/topic/${topic.id}`} key={topic.id} style={{ textDecoration: 'none' }}>
                          <Card 
                            _hover={{ boxShadow: 'lg', borderColor: 'brand.500', transform: 'translateY(-2px)' }} 
                            transition="all 0.2s" 
                            cursor="pointer"
                            variant="outline" 
                            borderColor="gray.200"
                          >
                            <CardBody>
                              <HStack justify="space-between">
                                <VStack align="start" spacing={1} w="100%">
                                  <Text fontWeight="bold">{topic.title}</Text>
                                  <HStack spacing={4} fontSize="sm" color="gray.600">
                                    <Text>{new Date(topic.created_at).toLocaleDateString('ko-KR')}</Text>
                                    <Text>지역: {topic.district || topic.region || '전체'}</Text>
                                  </HStack>
                                </VStack>
                                {/* 토론 참여 버튼 제거됨 */}
                              </HStack>
                            </CardBody>
                          </Card>
                        </Link>
                      ))
                    )}
                  </VStack>
                </TabPanel>

                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    <Text fontWeight="bold">선거 유형 선택</Text>
                    <HStack spacing={2} flexWrap="wrap">
                      {['구의원', '국회의원', '시의원', '구청장'].map((type) => (
                        <Button key={type} size="sm" variant="outline">
                          {type}
                        </Button>
                      ))}
                    </HStack>

                    <VStack spacing={3} align="stretch" mt={4}>
                      {isLoading ? (
                        <Box textAlign="center" py={8}>
                          <Spinner size="xl" />
                        </Box>
                      ) : pledges.length === 0 ? (
                        <Text textAlign="center" py={8} color="gray.500">
                          등록된 공약이 없습니다.
                        </Text>
                      ) : (
                        pledges.map((pledge) => (
                          // [수정] 카드 전체 Link 적용 및 버튼 제거
                          <Link href={`/debate/topic/${pledge.id}`} key={pledge.id} style={{ textDecoration: 'none' }}>
                            <Card 
                              _hover={{ boxShadow: 'lg', borderColor: 'brand.500', transform: 'translateY(-2px)' }} 
                              transition="all 0.2s" 
                              cursor="pointer"
                              variant="outline" 
                              borderColor="gray.200"
                            >
                              <CardBody>
                                <VStack align="start" spacing={2} w="100%">
                                  <HStack w="100%" justify="space-between">
                                    <HStack>
                                      <Badge colorScheme="purple">{pledge.district || '전체'}</Badge>
                                      <Text fontWeight="bold">{pledge.title}</Text>
                                    </HStack>
                                  </HStack>
                                  <Text fontSize="sm" color="gray.600">
                                    {new Date(pledge.created_at).toLocaleDateString('ko-KR')}
                                  </Text>
                                  {/* 토론 참여 버튼 제거됨 */}
                                </VStack>
                              </CardBody>
                            </Card>
                          </Link>
                        ))
                      )}
                    </VStack>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        </VStack>
      </Container>

      {/* 모달 (기존과 동일) */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {activeTab === 0 ? '지역 현안 주제 생성' : '공약 토론 주제 생성'}
          </ModalHeader>
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
                <FormLabel>지역 선택 (광역)</FormLabel>
                <Select
                  value={createRegion}
                  onChange={(e) => {
                    setCreateRegion(e.target.value)
                    const firstDistrict = regions[e.target.value as keyof typeof regions].districts[0]
                    setCreateDistrict(firstDistrict)
                  }}
                >
                  {Object.entries(regions).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>세부 지역 (기초)</FormLabel>
                <Select
                  value={createDistrict}
                  onChange={(e) => setCreateDistrict(e.target.value)}
                >
                  {regions[createRegion as keyof typeof regions].districts.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
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