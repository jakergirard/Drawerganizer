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
import { toast } from "sonner"

interface Settings {
    printer_name: string;
    host: string;
    port: number;
    virtual_printing: boolean;
}

const defaultSettings: Settings = {
    printer_name: "",
    host: "",
    port: 631,
    virtual_printing: false
};

function SettingsDialog() {
    const [settings, set_settings] = useState<Settings>(defaultSettings);
    const [is_open, set_is_open] = useState(false);

    useEffect(() => {
        fetch('/api/printer')
            .then(res => res.json())
            .then(data => {
                set_settings({
                    printer_name: data.printer_name || "",
                    host: data.host || "",
                    port: data.port || 631,
                    virtual_printing: Boolean(data.virtual_printing)
                });
            })
            .catch(console.error);
    }, []);

    const handle_submit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await fetch('/api/printer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    printer_name: settings.printer_name.trim(),
                    host: settings.host.trim(),
                    port: settings.port,
                    virtual_printing: settings.virtual_printing
                })
            });
            toast.success('Settings saved successfully');
            set_is_open(false);
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error('Failed to save settings');
        }
    };

    return (
        <Dialog open={is_open} onOpenChange={set_is_open}>
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
                        <span className="text-sm font-medium">CUPS Printer Queue Name</span>
                        <Input
                            placeholder="e.g. MyPrinter"
                            value={settings.printer_name}
                            onChange={(e) => set_settings({ ...settings, printer_name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <span className="text-sm font-medium">CUPS Server Host IP</span>
                        <Input
                            placeholder="e.g. localhost or 192.168.1.5"
                            value={settings.host}
                            onChange={(e) => set_settings({ ...settings, host: e.target.value })}
                        />
                    </div>
                    <div className="flex items-center justify-between space-x-4">
                        <span className="text-sm font-medium">Print Preview</span>
                        <Switch
                            checked={settings.virtual_printing}
                            onCheckedChange={(checked: boolean) => set_settings({ ...settings, virtual_printing: checked })}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handle_submit} className="flex-1">Save Settings</Button>
                        <Button variant="outline" onClick={() => set_is_open(false)} className="flex-1">Cancel</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export { SettingsDialog as Settings }
