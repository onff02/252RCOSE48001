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
} from '@chakra-ui/react'
import Link from 'next/link'
import { topicsAPI } from '@/lib/api'

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
  const [selectedRegion, setSelectedRegion] = useState('seoul')
  const [selectedDistrict, setSelectedDistrict] = useState('서울 전체')
  const [activeTab, setActiveTab] = useState(0)
  const [topics, setTopics] = useState<any[]>([])
  const [pledges, setPledges] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [selectedRegion, selectedDistrict, activeTab])

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

  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          <HStack justify="space-between">
            <Heading as="h1" size="xl">
              토론 게시판
            </Heading>
            <HStack spacing={2}>
              <Link 
                href={`/write?region=${selectedRegion}&district=${encodeURIComponent(selectedDistrict)}&topic_type=${activeTab === 0 ? 'region' : 'pledge'}`}
              >
                <Button colorScheme="green">토론 주제 생성</Button>
              </Link>
              <Link href="/">
                <Button variant="outline">메인으로</Button>
              </Link>
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
                        <Card key={topic.id} _hover={{ boxShadow: 'lg' }} cursor="pointer">
                          <CardBody>
                            <HStack justify="space-between">
                              <VStack align="start" spacing={1}>
                                <Text fontWeight="bold">{topic.title}</Text>
                                <HStack spacing={4} fontSize="sm" color="gray.600">
                                  <Text>{new Date(topic.created_at).toLocaleDateString('ko-KR')}</Text>
                                  <Text>지역: {topic.district || topic.region || '전체'}</Text>
                                </HStack>
                              </VStack>
                              <Link href={`/debate/topic/${topic.id}`}>
                                <Button colorScheme="blue" size="sm">
                                  토론 참여
                                </Button>
                              </Link>
                            </HStack>
                          </CardBody>
                        </Card>
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
                          <Card key={pledge.id} _hover={{ boxShadow: 'lg' }} cursor="pointer">
                            <CardBody>
                              <VStack align="start" spacing={2}>
                                <HStack>
                                  <Badge colorScheme="purple">{pledge.district || '전체'}</Badge>
                                  <Text fontWeight="bold">{pledge.title}</Text>
                                </HStack>
                                <Text fontSize="sm" color="gray.600">
                                  {new Date(pledge.created_at).toLocaleDateString('ko-KR')}
                                </Text>
                                <Link href={`/debate/topic/${pledge.id}`}>
                                  <Button colorScheme="blue" size="sm">
                                    찬반 토론 참여
                                  </Button>
                                </Link>
                              </VStack>
                            </CardBody>
                          </Card>
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
    </Box>
  )
}

