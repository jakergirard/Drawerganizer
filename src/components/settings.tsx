"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Settings as SettingsIcon } from 'lucide-react'
import { ThemeToggle } from "./theme-toggle"
import { Input } from "@/components/ui/input"
import { useState, useEffect, useRef } from "react"

export function Settings() {
  const [cupsServer, setCupsServer] = useState("")
  const [queueName, setQueueName] = useState("")
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const savedCupsServer = localStorage.getItem("cupsServer") || ""
    const savedQueueName = localStorage.getItem("queueName") || ""
    setCupsServer(savedCupsServer)
    setQueueName(savedQueueName)
  }, [])

  const handleSave = () => {
    localStorage.setItem("cupsServer", cupsServer)
    localStorage.setItem("queueName", queueName)
    closeRef.current?.click()
  }

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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Theme</span>
            <ThemeToggle />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">CUPS Server IP</label>
            <Input
              value={cupsServer}
              onChange={(e) => setCupsServer(e.target.value)}
              placeholder="e.g., 192.168.1.100:631"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Printer Queue Name</label>
            <Input
              value={queueName}
              onChange={(e) => setQueueName(e.target.value)}
              placeholder="e.g., DYMO_LabelWriter_450_Turbo"
            />
          </div>
          <Button onClick={handleSave} className="w-full">Save Settings</Button>
        </div>
      </DialogContent>
      <DialogClose ref={closeRef} />
    </Dialog>
  )
}
