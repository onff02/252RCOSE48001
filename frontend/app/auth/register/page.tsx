'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Container,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  VStack,
  Select,
  Text,
  Link as ChakraLink,
  useToast,
} from '@chakra-ui/react'
import Link from 'next/link'
import { authAPI } from '@/lib/api'

export default function RegisterPage() {
  const router = useRouter()
  const toast = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    politicalParty: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: '오류',
        description: '비밀번호가 일치하지 않습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsLoading(true)
    try {
      await authAPI.register(
        formData.username,
        formData.password,
        formData.politicalParty || undefined
      )
      toast({
        title: '회원가입 성공',
        description: '회원가입이 완료되었습니다.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      router.push('/')
    } catch (error: any) {
      toast({
        title: '회원가입 실패',
        description: error.message || '회원가입에 실패했습니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box minH="100vh" bg="gray.50" py={12}>
      <Container maxW="md">
        <Box bg="white" p={8} borderRadius="lg" boxShadow="md">
          <VStack spacing={6} align="stretch">
            <Heading as="h1" size="xl" textAlign="center">
              회원가입
            </Heading>

            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>아이디</FormLabel>
                  <Input
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    placeholder="아이디를 입력하세요"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>비밀번호</FormLabel>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="비밀번호를 입력하세요"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>비밀번호 확인</FormLabel>
                  <Input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="비밀번호를 다시 입력하세요"
                  />
                </FormControl>

                {/* 정당 선택 옵션 업데이트됨 */}
                <FormControl isRequired>
                  <FormLabel>선호 정당</FormLabel>
                  <Select
                    placeholder="정당을 선택하세요"
                    value={formData.politicalParty}
                    onChange={(e) =>
                      setFormData({ ...formData, politicalParty: e.target.value })
                    }
                  >
                    <option value="Democratic">더불어민주당</option>
                    <option value="People_Power">국민의힘</option>
                    <option value="Rebuilding_Korea">조국혁신당</option>
                    <option value="The_Progressive">진보당</option>
                    <option value="Reform">개혁신당</option>
                    <option value="Basic_Income">기본소득당</option>
                    <option value="The_Social_Democratic">사회민주당</option>
                    <option value="Minor">기타</option>
                    <option value="None">없음</option>
                  </Select>
                </FormControl>

                <Button 
                  type="submit" 
                  colorScheme="blue" 
                  width="full" 
                  size="lg"
                  isLoading={isLoading}
                  loadingText="회원가입 중..."
                >
                  회원가입
                </Button>
              </VStack>
            </form>

            <Text textAlign="center">
              이미 계정이 있으신가요?{' '}
              {/* Link 중첩 에러 수정됨 */}
              <ChakraLink as={Link} href="/auth/login" color="blue.500">
                로그인
              </ChakraLink>
            </Text>
          </VStack>
        </Box>
      </Container>
    </Box>
  )
}