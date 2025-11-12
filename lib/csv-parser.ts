import type { KeywordData, KeywordInfo } from "./types"

/**
 * CSV 파일을 파싱하여 KeywordData 형식으로 변환합니다.
 */
export async function parseCSV(): Promise<KeywordData> {
  try {
    const response = await fetch('/date-set-calendar.csv')
    const text = await response.text()
    
    const lines = text.split('\n')
    const headers = lines[0].split(',')
    
    // 월별 데이터 컬럼 시작 인덱스 찾기 (2021-11부터 시작)
    const monthStartIndex = headers.findIndex(h => h.includes('2021-11'))
    
    const keywordData: KeywordData = {}
    
    // 헤더를 제외한 각 라인 처리
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      const values = line.split(',')
      const keyword = values[0]
      
      if (!keyword) continue
      
      const malePercent = parseFloat(values[1]) || 0
      const femalePercent = parseFloat(values[2]) || 0
      
      // 연령대별 데이터
      const ageGroups = {
        "12세 이하": parseFloat(values[4]) || 0,
        "13~19세": parseFloat(values[5]) || 0,
        "20~24세": parseFloat(values[6]) || 0,
        "25~29세": parseFloat(values[7]) || 0,
        "30~39세": parseFloat(values[8]) || 0,
        "40~49세": parseFloat(values[9]) || 0,
        "50세 이상": parseFloat(values[10]) || 0,
      }
      
      // 월별 데이터
      const monthlyData: Record<string, number> = {}
      for (let j = monthStartIndex; j < headers.length; j++) {
        const monthKey = headers[j].trim()
        const value = parseInt(values[j]) || 0
        monthlyData[monthKey] = value
      }
      
      keywordData[keyword] = {
        malePercent,
        femalePercent,
        ageGroups,
        monthlyData,
      }
    }
    
    return keywordData
  } catch (error) {
    console.error('CSV 파싱 중 오류 발생:', error)
    return {}
  }
}

/**
 * 특정 월의 평균 대비 상승폭을 계산합니다.
 */
export function calculateMonthlyGrowth(
  keywordData: KeywordData,
  year: number,
  month: number
): Array<{ keyword: string; growth: number; volume: number }> {
  const results: Array<{ keyword: string; growth: number; volume: number }> = []
  
  const monthKey = `${year}-${String(month).padStart(2, '0')}`
  
  Object.entries(keywordData).forEach(([keyword, data]) => {
    const currentValue = data.monthlyData[monthKey]
    if (!currentValue) return
    
    // 전체 기간의 평균 계산
    const allValues = Object.values(data.monthlyData).filter(v => v > 0)
    if (allValues.length === 0) return
    
    const average = allValues.reduce((sum, val) => sum + val, 0) / allValues.length
    
    // 평균 대비 상승폭 계산
    const growth = ((currentValue - average) / average) * 100
    
    results.push({
      keyword,
      growth,
      volume: currentValue,
    })
  })
  
  // 상승폭이 큰 순서로 정렬
  return results.sort((a, b) => b.growth - a.growth)
}

/**
 * 이전 달 대비 상승폭을 계산합니다.
 */
export function calculatePreviousMonthGrowth(
  data: KeywordInfo,
  year: number,
  month: number
): { growth: number; volume: number } {
  const monthKey = `${year}-${String(month).padStart(2, '0')}`
  const currentValue = data.monthlyData[monthKey] || 0
  
  // 이전 달 키 계산
  let prevYear = year
  let prevMonth = month - 1
  if (prevMonth === 0) {
    prevMonth = 12
    prevYear = year - 1
  }
  
  const prevMonthKey = `${prevYear}-${String(prevMonth).padStart(2, '0')}`
  const previousValue = data.monthlyData[prevMonthKey] || 0
  
  if (previousValue === 0) {
    return { growth: 0, volume: currentValue }
  }
  
  const growth = ((currentValue - previousValue) / previousValue) * 100
  
  return { growth, volume: currentValue }
}

