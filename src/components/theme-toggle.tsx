"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Switch } from "@/components/ui/switch"

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme()
  const [is_mounted, set_is_mounted] = React.useState(false)

  React.useEffect(() => {
    set_is_mounted(true)
  }, [])

  if (!is_mounted) {
    return null
  }

  const is_dark = theme === "dark" || (theme === "system" && systemTheme === "dark")

  return (
    <div className="flex items-center gap-2">
      <Sun className="h-4 w-4" />
      <Switch
        checked={is_dark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
      />
      <Moon className="h-4 w-4" />
      <span className="text-xs text-muted-foreground ml-2">
        {theme === "system" ? "System" : theme}
      </span>
    </div>
  )
}
