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

                <FormControl isRequired>
                  <FormLabel>선호 정당</FormLabel>
                  <Select
                    placeholder="정당을 선택하세요"
                    value={formData.politicalParty}
                    onChange={(e) =>
                      setFormData({ ...formData, politicalParty: e.target.value })
                    }
                  >
                    <option value="democratic">민주당</option>
                    <option value="people_power">국민의힘</option>
                    <option value="justice">정의당</option>
                    <option value="green">녹색당</option>
                    <option value="basic_income">기본소득당</option>
                    <option value="none">없음</option>
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
              <Link href="/auth/login">
                <ChakraLink color="blue.500">로그인</ChakraLink>
              </Link>
            </Text>
          </VStack>
        </Box>
      </Container>
    </Box>
  )
}

