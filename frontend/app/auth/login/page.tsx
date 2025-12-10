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
  Text,
  Link as ChakraLink,
  useToast,
} from '@chakra-ui/react'
import Link from 'next/link'
import { authAPI } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const toast = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await authAPI.login(formData.username, formData.password)
      toast({
        title: '로그인 성공',
        description: '로그인되었습니다.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      router.push('/')
    } catch (error: any) {
      toast({
        title: '로그인 실패',
        description: error.message || '아이디 또는 비밀번호가 잘못되었습니다.',
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
              로그인
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

                <Button 
                  type="submit" 
                  colorScheme="blue" 
                  width="full" 
                  size="lg"
                  isLoading={isLoading}
                  loadingText="로그인 중..."
                >
                  로그인
                </Button>
              </VStack>
            </form>

            <Text textAlign="center">
              계정이 없으신가요?{' '}
              <ChakraLink as={Link} href="/auth/register" color="blue.500">
                회원가입
              </ChakraLink>
            </Text>
          </VStack>
        </Box>
      </Container>
    </Box>
  )
}

