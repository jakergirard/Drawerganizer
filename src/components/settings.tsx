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
import { Switch } from "@/components/ui/switch"

export function Settings() {
  const [settings, setSettings] = useState({
    cupsServer: "",
    queueName: "",
    virtualPrinting: false
  });
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const savedCupsServer = localStorage.getItem("cupsServer") || ""
    const savedQueueName = localStorage.getItem("queueName") || ""
    const savedVirtualPrinting = localStorage.getItem("virtualPrinting") === "true"
    setSettings({
      cupsServer: savedCupsServer,
      queueName: savedQueueName,
      virtualPrinting: savedVirtualPrinting
    })
  }, [])

  const handleSave = () => {
    localStorage.setItem("cupsServer", settings.cupsServer)
    localStorage.setItem("queueName", settings.queueName)
    localStorage.setItem("virtualPrinting", settings.virtualPrinting.toString())
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
        <div className="space-y-6">
          <div className="flex items-center justify-between space-x-4">
            <span className="text-sm font-medium">Theme</span>
            <ThemeToggle />
          </div>
          <div className="space-y-2">
            <span className="text-sm font-medium">CUPS Server IP</span>
            <Input
              value={settings.cupsServer}
              onChange={(e) => setSettings({ ...settings, cupsServer: e.target.value })}
              placeholder="e.g., 192.168.1.100:631"
            />
          </div>
          <div className="space-y-2">
            <span className="text-sm font-medium">Printer Queue Name</span>
            <Input
              value={settings.queueName}
              onChange={(e) => setSettings({ ...settings, queueName: e.target.value })}
              placeholder="e.g., DYMO_LabelWriter_450_Turbo"
            />
          </div>
          <div className="flex items-center justify-between space-x-4">
            <span className="text-sm font-medium">Print Preview</span>
            <Switch
              checked={settings.virtualPrinting}
              onCheckedChange={(checked) => setSettings({ ...settings, virtualPrinting: checked })}
            />
          </div>
          <Button onClick={handleSave} className="w-full">Save Settings</Button>
        </div>
      </DialogContent>
      <DialogClose ref={closeRef} />
    </Dialog>
  )
}
