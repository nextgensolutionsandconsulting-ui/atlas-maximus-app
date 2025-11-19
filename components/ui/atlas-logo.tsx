"use client"

import Image from "next/image"

interface AtlasLogoProps {
  width?: number
  height?: number
  className?: string
  alt?: string
}

export function AtlasLogo({ width = 160, height = 160, className = "", alt = "Atlas Maximus Logo" }: AtlasLogoProps) {
  return (
    <div 
      style={{ width, height }} 
      className={`relative overflow-hidden rounded-full ${className}`}
    >
      <Image
        src="/atlas-logo.png"
        alt={alt}
        fill
        className="object-cover"
        priority
      />
    </div>
  )
}
