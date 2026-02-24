"use client"

import { motion } from "framer-motion"
import { ThemeToggle } from "./theme-toggle"

export function Header() {
  return (
    <motion.header
      className="border-b border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl fixed top-0 left-0 right-0 z-40 shadow-sm"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Veritas AI
          </h1>
          <ThemeToggle />
        </div>
      </div>
    </motion.header>
  )
}
