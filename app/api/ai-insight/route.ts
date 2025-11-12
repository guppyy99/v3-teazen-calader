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
    
    const prompt = `당신은 네이버, 구글 등 포털 검색 데이터를 분석하는 마케팅 전문가입니다.

아래는 실제 포털 검색 데이터입니다:

**키워드**: ${keyword}
**분석 시점**: ${year}년 ${month}월
**현재 월 검색량**: ${volume.toLocaleString()}건
**평균 대비 상승률**: ${growth > 0 ? '+' : ''}${growth.toFixed(1)}%

**최근 6개월 검색량 추이**:
${trendText}

**분석 지침**:
1. 위 실제 검색 데이터를 기반으로 ${month}월에 검색량이 ${growth > 0 ? '급증' : '감소'}한 원인을 분석하세요
2. 계절적 요인, 사회적 이벤트, 마케팅 활동, 트렌드 변화 등을 고려하세요
3. 구체적인 숫자와 데이터를 언급하여 신뢰성을 높이세요
4. 2-3문장으로 간결하고 명확하게 작성하세요
5. 전문적이지만 이해하기 쉬운 언어를 사용하세요

**답변 형식**: 
검색량이 ${volume.toLocaleString()}건으로 평균 대비 ${Math.abs(Math.round(growth))}% ${growth > 0 ? '상승' : '하락'}했습니다. [구체적인 원인 분석 2-3문장]`

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
            content: '당신은 네이버, 구글 등 포털 검색 데이터를 분석하는 시니어 마케팅 애널리스트입니다. 실제 데이터를 기반으로 정확하고 통찰력 있는 분석을 제공하며, 구체적인 숫자와 트렌드를 언급하여 신뢰성을 높입니다.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 400,
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

