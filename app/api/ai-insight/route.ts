import { NextResponse } from 'next/server'

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

# 요구사항

다음 내용을 **2-3문장**으로 작성하세요:

1. **왜 이런 변화가 발생했는지** (계절, 이벤트, 사회 트렌드, 경쟁사 동향 등)
2. **마케팅 팀이 활용할 수 있는 구체적인 액션** (프로모션 시기, 타겟 고객, 콘텐츠 전략 등)
3. **다음 달 예상 트렌드**

# 답변 형식

검색량이 ${volume.toLocaleString()}건으로 평균 대비 ${Math.abs(Math.round(growth))}% 상승했습니다. [원인 1문장]. [마케팅 활용 방안 및 다음 달 예측 1-2문장].

# 예시

"검색량이 5,367,700건으로 평균 대비 461% 상승했습니다. 여름 휴가철과 7월 급여일이 겹치며 배달 음식 수요가 폭증한 것으로 분석됩니다. 이 시기에 할인 쿠폰과 세트 메뉴 프로모션을 집중하면 효과적이며, 8월에도 비슷한 패턴이 예상되므로 사전 재고 확보가 필요합니다."`

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

