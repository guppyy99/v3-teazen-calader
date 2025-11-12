"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface CalendarHeaderProps {
  year: number
  month: number
  onYearChange: (year: number) => void
  onMonthChange: (month: number) => void
}

const months = [
  { value: 1, label: "1월" },
  { value: 2, label: "2월" },
  { value: 3, label: "3월" },
  { value: 4, label: "4월" },
  { value: 5, label: "5월" },
  { value: 6, label: "6월" },
  { value: 7, label: "7월" },
  { value: 8, label: "8월" },
  { value: 9, label: "9월" },
  { value: 10, label: "10월" },
  { value: 11, label: "11월" },
  { value: 12, label: "12월" },
]

export function CalendarHeader({ year, month, onYearChange, onMonthChange }: CalendarHeaderProps) {
  const currentDate = new Date()
  const formattedDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`
  const formattedTime = `오후 ${currentDate.getHours() % 12 || 12}:${String(currentDate.getMinutes()).padStart(2, "0")}`

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Calander</h2>
        <div className="text-sm text-gray-500">
          {formattedDate} {formattedTime} ⟳ 데이터업데이트
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-semibold text-gray-800">{year}</span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-gray-100"
                onClick={() => onYearChange(year - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-gray-100"
                onClick={() => onYearChange(year + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-1 gap-2">
            {months.map((m) => (
              <button
                key={m.value}
                onClick={() => onMonthChange(m.value)}
                className={`flex h-12 flex-1 items-center justify-center rounded-full text-sm font-medium transition-all ${
                  month === m.value ? "bg-gray-800 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
