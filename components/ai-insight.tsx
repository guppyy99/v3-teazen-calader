"use client"

import { useState, useEffect } from "react"
import { Sparkles } from "lucide-react"
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
  const [hasGenerated, setHasGenerated] = useState(false)

  // 월이 변경되면 인사이트 리셋
  useEffect(() => {
    setHasGenerated(false)
    setInsight("")
    setTopKeyword("")
  }, [selectedYear, selectedMonth])

  const generateInsight = async () => {
    if (Object.keys(keywordData).length === 0) return

    setLoading(true)
    setHasGenerated(true)
    
    // 해당 월의 상승폭이 가장 큰 키워드 찾기
    const growthData = calculateMonthlyGrowth(keywordData, selectedYear, selectedMonth)
    
    if (growthData.length === 0) {
      setInsight("해당 월의 데이터가 없습니다.")
      setLoading(false)
      return
    }

    const top = growthData[0]
    setTopKeyword(top.keyword)

    // 최근 6개월 데이터 추출
    const keywordInfo = keywordData[top.keyword]
    const previousMonths = []
    
    if (keywordInfo) {
      for (let i = 5; i >= 0; i--) {
        const targetDate = new Date(selectedYear, selectedMonth - 1)
        targetDate.setMonth(targetDate.getMonth() - i)
        
        const monthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`
        const volume = keywordInfo.monthlyData[monthKey] || 0
        
        previousMonths.push({
          month: `${targetDate.getFullYear()}.${String(targetDate.getMonth() + 1).padStart(2, '0')}`,
          volume: volume
        })
      }
    }

    try {
      // GPT API 호출 (실제 검색 데이터 포함)
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
          previousMonths: previousMonths,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setInsight(data.insight)
      } else {
        // API 호출 실패 시 실제 데이터 기반 기본 인사이트
        const trend = previousMonths.length >= 2 
          ? previousMonths[previousMonths.length - 1].volume > previousMonths[previousMonths.length - 2].volume 
            ? '상승세' 
            : '하락세'
          : '변동'
        
        setInsight(
          `검색량이 ${top.volume.toLocaleString()}건으로 평균 대비 ${Math.abs(Math.round(top.growth))}% ${top.growth > 0 ? '상승' : '하락'}했습니다. 최근 ${trend}를 보이고 있으며, 계절적 요인이나 이벤트의 영향으로 분석됩니다.`
        )
      }
    } catch (error) {
      console.error('AI 인사이트 생성 오류:', error)
      // 오류 발생 시 실제 데이터 기반 기본 인사이트
      const top = growthData[0]
      setInsight(
        `검색량이 ${top.volume.toLocaleString()}건으로 평균 대비 ${Math.abs(Math.round(top.growth))}% ${top.growth > 0 ? '상승' : '하락'}했습니다. 실제 검색 데이터를 기반으로 분석되었습니다.`
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-6">
      <h3 className="mb-4 text-xl font-semibold text-gray-800 text-center">AI 인사이트</h3>
      
      {!hasGenerated ? (
        // 인사이트 생성 버튼
        <div className="flex justify-center">
          <button
            onClick={generateInsight}
            disabled={loading || Object.keys(keywordData).length === 0}
            className="group relative flex items-center gap-2 rounded-full px-8 py-3.5 text-white font-semibold shadow-md hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden"
            style={{
              background: 'linear-gradient(to right, #F2B0ED, #CAB2F4)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(to right, #E85DD7, #9D7DE8)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(to right, #F2B0ED, #CAB2F4)'
            }}
          >
            <Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
            <span>{selectedMonth}월 인사이트 생성</span>
          </button>
        </div>
      ) : (
        // 인사이트 결과 표시
        <div className="rounded-full bg-white px-6 py-5 relative overflow-hidden">
          {/* 그라데이션 테두리 */}
          <div className="absolute inset-0 rounded-full p-[2px] bg-gradient-to-r from-[#F2B0ED] to-[#CAB2F4]">
            <div className="h-full w-full rounded-full bg-white" />
          </div>
          <div className="relative flex flex-col items-center gap-3">
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
                <p className="text-sm text-gray-600">AI 인사이트 생성 중...</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-base font-bold text-gray-900 mb-2">
                  "{topKeyword}" 상승폭 가장 높음
                </p>
                <p className="text-sm leading-relaxed text-gray-700">
                  {insight}
                </p>
                <button
                  onClick={() => {
                    setHasGenerated(false)
                    setInsight("")
                    setTopKeyword("")
                  }}
                  className="mt-4 text-xs text-purple-600 hover:text-purple-700 underline"
                >
                  다시 생성
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
