import { NextResponse } from 'next/server'

/**
 * Serper API를 통해 실제 웹 검색 결과를 가져옵니다
 */
async function searchWeb(keyword: string, year: number, month: number): Promise<string> {
  const serperApiKey = process.env.SERPER_API_KEY
  
  if (!serperApiKey) {
    return '' // Serper API 키가 없으면 검색 건너뛰기
  }
  
  try {
    // 검색 쿼리: "키워드 2025년 7월" 형식
    const searchQuery = `${keyword} ${year}년 ${month}월 트렌드 이슈`
    
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': serperApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: searchQuery,
        gl: 'kr', // 한국 검색 결과
        hl: 'ko', // 한국어
        num: 5,   // 상위 5개 결과
      }),
    })
    
    if (!response.ok) {
      console.error('Serper API 오류:', response.statusText)
      return ''
    }
    
    const data = await response.json()
    
    // 검색 결과 요약
    const searchResults = data.organic?.slice(0, 5).map((item: any, idx: number) => 
      `${idx + 1}. ${item.title}\n${item.snippet || ''}`
    ).join('\n\n') || ''
    
    return searchResults
  } catch (error) {
    console.error('웹 검색 중 오류:', error)
    return ''
  }
}

export async function POST(request: Request) {
  try {
    const { keyword, growth, volume, year, month, monthlyData, previousMonths } = await request.json()
    
    const apiKey = process.env.OPENAI_API_KEY
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key가 설정되지 않았습니다.' },
        { status: 500 }
      )
    }
    
    // 실제 웹 검색 수행
    const webSearchResults = await searchWeb(keyword, year, month)
    
    // 월별 검색량 추이 문자열 생성
    const trendText = previousMonths?.map((m: any) => `${m.month}: ${m.volume.toLocaleString()}건`).join(', ') || ''
    
    // 전월 대비 변화율 계산
    const prevMonthVolume = previousMonths?.[previousMonths.length - 2]?.volume || 0
    const monthOverMonth = prevMonthVolume > 0 
      ? ((volume - prevMonthVolume) / prevMonthVolume * 100).toFixed(1)
      : '0'
    
    const prompt = `당신은 마케팅 전략 컨설턴트입니다. 기업이 활용할 수 있는 실질적인 인사이트를 제공하세요.

# 실제 검색 데이터 분석

**키워드**: "${keyword}"
**시점**: ${year}년 ${month}월
**검색량**: ${volume.toLocaleString()}건
**평균 대비**: ${growth > 0 ? '+' : ''}${growth.toFixed(1)}%
**전월 대비**: ${monthOverMonth}%

**최근 6개월 추이**:
${trendText}

${webSearchResults ? `\n# 실제 웹 검색 결과 (네이버/구글 최신 정보)\n\n${webSearchResults}\n` : ''}

# 분석 요구사항

위의 **실제 검색 데이터**${webSearchResults ? '와 **웹 검색 결과**' : ''}를 종합하여 다음을 **2-3문장**으로 작성:

1. **왜 이런 변화가 발생했는지** 
   - ${webSearchResults ? '웹 검색에서 발견한 실제 이슈/이벤트' : '계절, 이벤트, 사회 트렌드'}
   - 구체적인 날짜와 사건 언급
   
2. **마케팅 팀이 즉시 실행할 수 있는 액션**
   - 프로모션 시기, 타겟 고객, 예산 배분
   - 콘텐츠 주제, 채널 전략
   
3. **다음 달 예상 트렌드 및 대응 방안**

# 답변 형식

검색량이 ${volume.toLocaleString()}건으로 평균 대비 ${Math.abs(Math.round(growth))}% 상승했습니다. [실제 검색에서 발견한 구체적 원인 1문장]. [즉시 실행 가능한 마케팅 액션 및 다음 달 예측 1-2문장].`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-5',
        messages: [
          {
            role: 'system',
            content: `당신은 실전 마케팅 전략 컨설턴트입니다. 

역할:
- 검색 데이터를 분석하여 즉시 실행 가능한 마케팅 전략 제시
- 계절성, 이벤트, 소비자 행동 패턴을 기반으로 원인 분석
- 타겟 고객층 식별 및 맞춤형 액션 플랜 제공
- 다음 달 트렌드 예측 및 대응 방안 제시

답변 스타일:
- 구체적인 숫자와 데이터 기반
- 즉시 실행 가능한 액션 중심
- 간결하고 명확한 2-3문장
- 비즈니스 임팩트 중심`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        reasoning_effort: 'high',
        verbosity: 'medium',
        max_tokens: 600,
      }),
    })
    
    if (!response.ok) {
      throw new Error(`OpenAI API 오류: ${response.statusText}`)
    }
    
    const data = await response.json()
    const insight = data.choices[0]?.message?.content || '인사이트를 생성할 수 없습니다.'
    
    return NextResponse.json({ insight })
  } catch (error) {
    console.error('AI 인사이트 생성 중 오류:', error)
    return NextResponse.json(
      { error: 'AI 인사이트 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}

