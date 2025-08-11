import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ThemeSwitcher } from "@/components/theme-switcher"

export default function SettingsPage()
{
  return (
  <div className="container mx-auto max-w-3xl py-8 px-4">
    <h1 className="text-3xl font-bold mb-8">Settings</h1>

    {/* Appearance Settings */}
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Customize the look and feel of the application.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="theme-toggle">Theme</Label>
          <ThemeSwitcher />
        </div>
        <div>
          <h3 className="text-md font-medium mb-2">NLGRB Color Palette</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-nlgrb-red border border-border" />
              <span className="text-sm mt-2 text-center">Red</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-nlgrb-yellow border border-border" />
              <span className="text-sm mt-2 text-center">Yellow</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-nlgrb-green border border-border" />
              <span className="text-sm mt-2 text-center">Green</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-nlgrb-gray border border-border" />
              <span className="text-sm mt-2 text-center">Gray</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Notifications Settings */}
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Manage your notification preferences.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="email-notifications">Email Notifications</Label>
          <Switch id="email-notifications" aria-label="Toggle email notifications" />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="push-notifications">Push Notifications</Label>
          <Switch id="push-notifications" aria-label="Toggle push notifications" />
        </div>
      </CardContent>
    </Card>

    {/* Language Settings */}
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Language</CardTitle>
        <CardDescription>Select your preferred language.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <Label htmlFor="language-select">Application Language</Label>
          <Select defaultValue="en" aria-label="Select application language">
            <SelectTrigger id="language-select" className="w-[180px]">
              <SelectValue placeholder="Select a language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="de">German</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  </div>
)
}
