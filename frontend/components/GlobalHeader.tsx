'use client'

import { Box, Container, Flex, Heading, HStack } from '@chakra-ui/react'
import Link from 'next/link'

export default function GlobalHeader() {
  return (
    <Box 
      as="header" 
      bg="white" 
      borderBottom="1px" 
      borderColor="gray.100" 
      position="sticky" 
      top={0} 
      zIndex={1000}
      h="64px"
      boxShadow="sm"
    >
      <Container maxW="container.xl" h="100%">
        <Flex h="100%" align="center" justify="space-between">
          {/* 로고 영역 */}
          <Link href="/" style={{ textDecoration: 'none' }}>
            <HStack spacing={2} align="center">
              <Heading 
                as="h1" 
                size="xl" 
                fontFamily="'Do Hyeon', sans-serif" 
                fontWeight="400"
                letterSpacing="0.02em"
                color="brand.600" // 그라데이션 제거 후 브랜드 단색 적용
                cursor="pointer"
                transition="all 0.2s"
                _hover={{ opacity: 0.8, transform: 'scale(1.02)' }}
                pt={1} // 폰트 위치를 미세하게 아래로 내림 (Visual centering)
              >
                이랑
              </Heading>
            </HStack>
          </Link>
          
          <Box />
        </Flex>
      </Container>
    </Box>
  )
}