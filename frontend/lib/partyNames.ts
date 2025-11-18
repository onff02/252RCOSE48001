// 정당 이름 매핑 (영어 -> 한글)
export const partyNameMap: Record<string, string> = {
  'democratic': '민주당',
  'people_power': '국민의힘',
  'people power': '국민의힘',
  'justice': '정의당',
  'green': '녹색당',
  'basic_income': '기본소득당',
  'none': '없음',
  // 대문자 변형도 지원
  'DEMOCRATIC': '민주당',
  'PEOPLE_POWER': '국민의힘',
  'PEOPLE POWER': '국민의힘',
  'JUSTICE': '정의당',
  'GREEN': '녹색당',
  'BASIC_INCOME': '기본소득당',
  'NONE': '없음',
}

export const getPartyName = (party: string | null | undefined): string => {
  if (!party) return ''
  return partyNameMap[party] || party
}

