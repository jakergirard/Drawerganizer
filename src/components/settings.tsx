"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Settings as SettingsIcon } from 'lucide-react'
import { ThemeToggle } from "./theme-toggle"

export function Settings() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <SettingsIcon className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-between">
          <span>Theme</span>
          <ThemeToggle />
        </div>
      </DialogContent>
    </Dialog>
  )
}
