'use client'

import { useState } from 'react'
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  useToast,
  Select,
  Text,
  Container,
  List,       // [중요] 추가됨
  ListItem,   // [중요] 추가됨
  ListIcon,   // [중요] 추가됨
} from '@chakra-ui/react'
import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons'
import { authAPI } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { partyNames } from '@/lib/partyNames' // 앞서 수정한 partyNames import

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [politicalParty, setPoliticalParty] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const toast = useToast()
  const router = useRouter()

  // 비밀번호 조건 실시간 체크 로직
  const passwordConditions = [
    { label: "8자 이상", valid: password.length >= 8 },
    { label: "영문 포함", valid: /[a-zA-Z]/.test(password) },
    { label: "숫자 포함", valid: /\d/.test(password) },
    { label: "특수문자 포함", valid: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ]

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!politicalParty) {
      toast({
        title: '입력 오류',
        description: '지지하는 정당을 반드시 선택해야 합니다.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsLoading(true)

    try {
      await authAPI.register(username, password, politicalParty)
      toast({
        title: '회원가입 성공',
        description: '로그인 페이지로 이동합니다.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      router.push('/auth/login')
    } catch (error: any) {
      toast({
        title: '회원가입 실패',
        description: error.response?.data?.detail || '회원가입 중 오류가 발생했습니다.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Container maxW="container.sm" py={10}>
      <Box p={8} bg="white" borderRadius="xl" boxShadow="lg" border="1px solid" borderColor="gray.100">
        <VStack spacing={6} as="form" onSubmit={handleRegister}>
          <Heading size="lg" color="brand.600">회원가입</Heading>
          
          <FormControl isRequired>
            <FormLabel>아이디</FormLabel>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="아이디를 입력하세요"
              focusBorderColor="brand.500"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>비밀번호</FormLabel>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              focusBorderColor="brand.500"
            />
            <Box mt={3} p={3} bg="gray.50" borderRadius="md">
              <Text fontSize="sm" fontWeight="bold" mb={2} color="gray.600">
                비밀번호 필수 조건:
              </Text>
              <List spacing={1}>
                {passwordConditions.map((condition, index) => (
                  <ListItem key={index} fontSize="sm" color={condition.valid ? "green.500" : "gray.500"} display="flex" alignItems="center">
                    <ListIcon as={condition.valid ? CheckCircleIcon : WarningIcon} color={condition.valid ? "green.500" : "gray.400"} />
                    {condition.label}
                  </ListItem>
                ))}
              </List>
            </Box>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>지지 정당 (선택)</FormLabel>
            <Select
              value={politicalParty}
              onChange={(e) => setPoliticalParty(e.target.value)}
              placeholder="지지하는 정당을 선택해주세요"
              focusBorderColor="brand.500"
            >
              {Object.entries(partyNames).map(([key, name]) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
            </Select>
          </FormControl>

          <Button
            type="submit"
            colorScheme="brand"
            width="full"
            size="lg"
            isLoading={isLoading}
            mt={4}
          >
            가입하기
          </Button>
        </VStack>
      </Box>
    </Container>
  )
}