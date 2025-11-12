"use client"

import Image from "next/image"

export function Footer() {
  return (
    <footer className="mt-12 border-t border-gray-200 bg-white py-8">
      <div className="mx-auto max-w-[1600px] px-6 md:px-8 lg:px-12">
        <div className="flex flex-col items-center justify-center gap-6 md:flex-row md:justify-between">
          {/* 로고들 */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Powered by</span>
              <img 
                src="/pentacle.svg" 
                alt="Pentacle" 
                className="h-6 opacity-70 hover:opacity-100 transition-opacity"
              />
            </div>
            <div className="h-6 w-px bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Developed by</span>
              <img 
                src="/finflow.svg" 
                alt="Finflow" 
                className="h-6 opacity-70 hover:opacity-100 transition-opacity"
              />
            </div>
          </div>

          {/* 카피라이트 */}
          <div className="text-center md:text-right">
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} TEAZEN. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

