import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WorkflowNode } from "@/lib/types/workflow";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Notification {
  id?: number;
  type: string;
  subject: string;
  body: string;
}

interface NotificationsTabProps {
  notification?: Notification;
  onNotificationsChange: (notification: Notification) => void;
}

export function NotificationsTab({
  notification,
  onNotificationsChange,
}: NotificationsTabProps) {
  const notificationTypes = ["Email", "SMS"];

  const handleInputChange = (field: keyof Notification, value: string) => {
    onNotificationsChange({ ...notification, [field]: value } as Notification);
  };

  return (
    <div className="space-y-4">
      {/* Notification Type Field */}
      <div className="space-y-2">
        <Label htmlFor="notificationType">Notification Type</Label>
        <Select
          value={notification?.type || ""}
          onValueChange={(value) => handleInputChange("type", value)}
        >
          <SelectTrigger id="notificationType">
            <SelectValue placeholder="Select notification type" />
          </SelectTrigger>
          <SelectContent>
            {notificationTypes.map((type) => (
              <SelectItem key={type} value={type.toLowerCase()}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Subject Field */}
      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          type="text"
          placeholder="Enter subject"
          value={notification?.subject || ""}
          onChange={(e) => handleInputChange("subject", e.target.value)}
        />
      </div>

      {/* Body Field */}
      <div className="space-y-2">
        <Label htmlFor="body">Body</Label>
        <Textarea
          id="body"
          className="w-full p-2 rounded"
          placeholder="Enter notification body"
          value={notification?.body || ""}
          onChange={(e) => handleInputChange("body", e.target.value)}
        />
      </div>
    </div>
  );
}
