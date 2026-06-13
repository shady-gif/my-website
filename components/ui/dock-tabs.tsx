"use client"

import { useState, useRef } from "react"
import { motion, MotionValue, useMotionValue, useSpring, useTransform } from "framer-motion"

interface DockItem {
  id: string
  name: string
  image: string
  color?: string
  onClick?: () => void
}

const dockItems = [
  {
    id: "ai-ppt",
    name: "Free AI PPT",
    image: "/ai-ppt.jpeg",
    onClick: () => window.open("https://ai-ppt2-kb3v.vercel.app/", "_blank"),
  },
  {
    id: "ai-pics",
    name: "Free AI Pics",
    image: "/ai-pics.jpeg",
    onClick: () => window.open("https://for-ppt.vercel.app/", "_blank"),
  },
  {
    id: "quick-game",
    name: "Quick Game?",
    image: "/quick-game.jpeg",
    onClick: () => window.open("https://coastal-break-run.vercel.app/", "_blank"),
  },
  {
    id: "go-top",
    name: "Go Top",
    image: "/go-top.jpeg",
    onClick: () =>
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      }),
  },
]

function DockIcon({ item, mouseX }: { item: DockItem; mouseX: MotionValue<number> }) {
  const ref = useRef<HTMLDivElement>(null)

  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }
    return val - bounds.x - bounds.width / 2
  })

  const width = useSpring(useTransform(distance, [-150, 0, 150], [56, 88, 56]), {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  })

  const height = useSpring(useTransform(distance, [-150, 0, 150], [56, 88, 56]), {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  })

  const [isHovered, setIsHovered] = useState(false)
  const [isClicked, setIsClicked] = useState(false)

  return (
    <motion.div
      ref={ref}
      style={{ width, height }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsClicked(true)}
      onMouseUp={() => setIsClicked(false)}
      onClick={item.onClick}
      className="aspect-square cursor-pointer flex items-center justify-center relative group"
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className={`w-full h-full rounded-2xl shadow-lg flex items-center justify-center relative overflow-hidden ${item.color}`}
        animate={{ y: isClicked ? 2 : isHovered ? -8 : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <img
          src={item.image}
          alt={item.name}
          className="h-full w-full object-cover"
        />

        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"
          animate={{ opacity: isHovered ? 0.3 : 0.1 }}
          transition={{ duration: 0.2 }}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.8 }}
        animate={{
          opacity: isHovered ? 1 : 0,
          y: isHovered ? -20 : 10,
          scale: isHovered ? 1 : 0.8,
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800/90 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap pointer-events-none backdrop-blur-sm"
      >
        {item.name}
      </motion.div>

      <motion.div
        className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white/80 rounded-full"
        animate={{
          scale: isClicked ? 1.5 : 1,
          opacity: isClicked ? 1 : 0.7,
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </motion.div>
  )
}

export function DockTabs() {
  const mouseX = useMotionValue(Infinity)

  return (
    <div className="fixed bottom-6 left-1/2 z-[9999] -translate-x-1/2">
      <motion.div
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className="mx-auto flex h-20 items-end gap-4 rounded-3xl bg-gray-100/40 backdrop-blur-md px-4 pb-3.5 border-2 border-white/20 shadow-xl"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 24,
        }}
      >
        {dockItems.map((item) => (
          <DockIcon key={item.id} item={item} mouseX={mouseX} />
        ))}
      </motion.div>
    </div>
  )
}
