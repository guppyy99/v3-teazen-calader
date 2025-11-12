import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { keyword, growth, volume, year, month } = await request.json()
    
    const apiKey = process.env.OPENAI_API_KEY
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key가 설정되지 않았습니다.' },
        { status: 500 }
      )
    }
    
    const prompt = `당신은 키워드 검색 트렌드 분석 전문가입니다. 
    
다음 데이터를 바탕으로 검색량 급증 원인을 분석해주세요:

- 키워드: ${keyword}
- 시점: ${year}년 ${month}월
- 평균 대비 상승률: ${growth.toFixed(1)}%
- 검색량: ${volume.toLocaleString()}

분석 요구사항:
1. 해당 시점에 검색량이 급증한 가능성이 높은 원인을 구체적으로 설명해주세요
2. 계절적 요인, 이벤트, 마케팅 활동 등을 고려해주세요
3. 2-3문장으로 간결하게 작성해주세요
4. "~것으로 예상됩니다" 또는 "~것으로 분석됩니다" 형식으로 마무리해주세요

답변 형식: "${month}월 ${keyword}의 검색량이 평균 대비 ${Math.abs(Math.round(growth))}% 상승했습니다. [원인 분석]"`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '당신은 키워드 검색 트렌드를 분석하는 마케팅 전문가입니다. 간결하고 명확하게 답변해주세요.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
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

