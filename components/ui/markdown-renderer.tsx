
"use client"

import React from 'react'
import { Download } from 'lucide-react'

interface MarkdownRendererProps {
  content: string
  className?: string
}

/**
 * Simple markdown renderer that supports:
 * - Links: [text](url)
 * - Bold: **text**
 * - Line breaks
 */
export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const renderContent = (text: string) => {
    const elements: React.ReactNode[] = []
    let lastIndex = 0
    
    // Combined regex for markdown links and bold text
    const markdownRegex = /(\[([^\]]+)\]\(([^)]+)\))|(\*\*([^*]+)\*\*)/g
    let match: RegExpExecArray | null
    
    while ((match = markdownRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        elements.push(text.substring(lastIndex, match.index))
      }
      
      if (match[1]) {
        // It's a link: [text](url)
        const linkText = match[2]
        const url = match[3]
        const isDownloadLink = url.includes('/api/templates/generate')
        
        elements.push(
          <a
            key={match.index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors cursor-pointer"
            style={{ textDecoration: 'underline' }}
          >
            {isDownloadLink && <Download className="h-4 w-4 flex-shrink-0" />}
            <span>{linkText}</span>
          </a>
        )
      } else if (match[4]) {
        // It's bold: **text**
        const boldText = match[5]
        elements.push(
          <strong key={match.index} className="font-bold">
            {boldText}
          </strong>
        )
      }
      
      lastIndex = match.index + match[0].length
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      elements.push(text.substring(lastIndex))
    }
    
    return elements.length > 0 ? elements : text
  }

  const lines = content.split('\n')
  
  return (
    <div className={className}>
      {lines.map((line, index) => {
        // Check if line is a header
        if (line.startsWith('### ')) {
          return (
            <h3 key={index} className="font-bold text-base mt-3 mb-2">
              {line.substring(4)}
            </h3>
          )
        } else if (line.startsWith('## ')) {
          return (
            <h2 key={index} className="font-bold text-lg mt-4 mb-2">
              {line.substring(3)}
            </h2>
          )
        } else if (line.startsWith('# ')) {
          return (
            <h1 key={index} className="font-bold text-xl mt-4 mb-3">
              {line.substring(2)}
            </h1>
          )
        }
        
        // Check if line is a list item
        if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
          return (
            <div key={index} className="flex items-start ml-2 my-1">
              <span className="mr-2">•</span>
              <span>{renderContent(line.substring(line.indexOf(' ') + 1))}</span>
            </div>
          )
        }
        
        // Regular paragraph
        return (
          <p key={index} className={line.trim() === '' ? 'h-2' : 'my-1'}>
            {line.trim() === '' ? '\u00A0' : renderContent(line)}
          </p>
        )
      })}
    </div>
  )
}
