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

위의 **실제 검색 데이터**${webSearchResults ? '와 **웹 검색 결과**' : ''}를 종합하여 **혈당 관리 관점**에서 다음을 **2-3문장**으로 작성:

1. **키워드 트렌드와 혈당 관리의 연관성**
   - 왜 이런 변화가 발생했는지
   - ${webSearchResults ? '웹 검색에서 발견한 실제 이슈/이벤트' : '계절, 건강 트렌드, 사회적 이벤트'}
   - 혈당 관리에 대한 관심도 변화 분석
   
2. **티젠 애사비 마케팅 액션**
   - 이 키워드 트렌드를 활용한 애사비 프로모션 전략
   - 타겟 고객층 (연령대, 관심사)
   - 메시징 방향 (혈당 관리, 간편성, 맛 등)
   - 광고 채널 및 시기
   
3. **다음 달 예상 및 대응**
   - 트렌드 지속 여부
   - 선제적 마케팅 준비사항

# 답변 형식 (혈당 커뮤니케이션 중심)

검색량이 ${volume.toLocaleString()}건으로 평균 대비 ${Math.abs(Math.round(growth))}% 상승했습니다. [혈당 관리 관점에서 원인 분석 1문장]. [애사비 제품과 연결한 구체적 마케팅 액션 1-2문장].

# 예시

"검색량이 5,367,700건으로 평균 대비 461% 상승했습니다. 배달음식 검색 급증은 외식 시 혈당 관리 어려움을 겪는 소비자가 증가했음을 의미하며, 특히 배달 후 애사비를 함께 섭취하는 '혈당 케어 루틴' 제안이 효과적입니다. 배달앱과의 제휴 프로모션(애사비 증정) 및 SNS 인플루언서를 통한 '배달음식+애사비' 콘텐츠 마케팅을 8-9월 집중 진행하면, 혈당 관리에 민감한 30-40대 직장인 타겟 확보가 가능합니다."`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `당신은 티젠(TEAZEN) 애사비 제품의 마케팅 전략 컨설턴트입니다.

# 티젠 애사비 제품 특성

**핵심 USP**:
1. 발효 사과식초 기반 - 식후 혈당 스파이크 예방 및 개선 도움
2. 스틱형 분말/젤리형 - 언제 어디서나 간편하게 물에 타먹거나 섭취
3. 국내산 풋사과(경북 재배) - 7~8월 수확, 자연발효 3단계 공정
4. 저당·저칼로리 - 당류 0g, 15kcal, 혈당 부담 없음
5. 4세대 포스트바이오틱스 유산균 - 장 건강 + 대사 건강
6. 상큼한 맛 - 전통 식초의 쿰쿰함 제거, Z세대도 즐길 수 있는 맛

**타겟 고객**:
- 혈당 관리가 필요한 30~50대
- 건강에 관심 많은 Z세대
- 간편한 건강 관리를 원하는 바쁜 직장인

# 역할

검색 키워드 트렌드를 분석하여:
1. 해당 키워드가 애사비 제품과 어떻게 연결되는지
2. 혈당 관리/건강 관심 증가와의 상관관계
3. 애사비 마케팅에 활용할 수 있는 구체적 액션
4. 타겟 고객 공략 방안

# 답변 스타일

- 항상 혈당 관리/건강 트렌드 관점에서 분석
- 애사비 제품 특성과 연결된 마케팅 액션 제시
- 구체적 숫자 기반, 2-3문장
- 즉시 실행 가능한 전략 중심`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 600,
      }),
    })
    
    if (!response.ok) {
      throw new Error(`OpenAI API 오류: ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log('✅ OpenAI 응답 성공:', data)
    
    const insight = data.choices[0]?.message?.content || '인사이트를 생성할 수 없습니다.'
    
    return NextResponse.json({ insight })
  } catch (error: any) {
    console.error('❌ AI 인사이트 생성 중 오류:', error)
    console.error('에러 상세:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    
    return NextResponse.json(
      { 
        error: `AI 인사이트 생성 실패: ${error.message || '알 수 없는 오류'}`,
        details: error.toString()
      },
      { status: 500 }
    )
  }
}

