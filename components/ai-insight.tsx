"use client"

import { Sparkles } from "lucide-react"
import { useEffect, useState } from "react"
import { calculateMonthlyGrowth } from "@/lib/csv-parser"
import type { KeywordData } from "@/lib/types"

interface AIInsightProps {
  selectedYear: number
  selectedMonth: number
  keywordData: KeywordData
}

export function AIInsight({ selectedYear, selectedMonth, keywordData }: AIInsightProps) {
  const [insight, setInsight] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [topKeyword, setTopKeyword] = useState<string>("")

  useEffect(() => {
    async function generateInsight() {
      if (Object.keys(keywordData).length === 0) return

      setLoading(true)
      
      // 해당 월의 상승폭이 가장 큰 키워드 찾기
      const growthData = calculateMonthlyGrowth(keywordData, selectedYear, selectedMonth)
      
      if (growthData.length === 0) {
        setInsight("해당 월의 데이터가 없습니다.")
        setLoading(false)
        return
      }

      const top = growthData[0]
      setTopKeyword(top.keyword)

      try {
        // GPT API 호출
        const response = await fetch('/api/ai-insight', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            keyword: top.keyword,
            growth: top.growth,
            volume: top.volume,
            year: selectedYear,
            month: selectedMonth,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          setInsight(data.insight)
        } else {
          // API 호출 실패 시 기본 인사이트
          setInsight(
            `${selectedMonth}월 '${top.keyword}'의 검색량이 평균 대비 ${Math.abs(Math.round(top.growth))}% ${top.growth > 0 ? '상승' : '하락'}했습니다. ${top.volume.toLocaleString()}건의 검색이 발생했으며, 계절적 요인 또는 마케팅 활동의 영향으로 분석됩니다.`
          )
        }
      } catch (error) {
        console.error('AI 인사이트 생성 오류:', error)
        // 오류 발생 시 기본 인사이트
        const top = growthData[0]
        setInsight(
          `${selectedMonth}월 '${top.keyword}'의 검색량이 평균 대비 ${Math.abs(Math.round(top.growth))}% ${top.growth > 0 ? '상승' : '하락'}했습니다. ${top.volume.toLocaleString()}건의 검색이 발생했습니다.`
        )
      } finally {
        setLoading(false)
      }
    }

    generateInsight()
  }, [selectedYear, selectedMonth, keywordData])

  return (
    <div className="mt-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-800">AI 인사이트</h3>
      <div className="rounded-2xl border-2 border-purple-200 bg-purple-50 px-6 py-5">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-600" />
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
              <p className="text-sm text-gray-600">AI 인사이트 생성 중...</p>
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-gray-800">
              <span className="font-semibold">{topKeyword}</span> {insight}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
