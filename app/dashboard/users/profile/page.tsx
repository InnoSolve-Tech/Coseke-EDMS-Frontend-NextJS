"use client";

import { getUserFromSessionStorage } from "@/components/routes/sessionStorage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { updatePassword, updateUser } from "@/core/users";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/lib/types/user";
import { Edit, Loader2 } from "lucide-react";
import * as React from "react";

export default function UserProfile() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  const [userDetails, setUserDetails] = React.useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [newPassword, setNewPassword] = React.useState({
    currentPassword: "",
    newPassword: "",
  });
  const [user, setUser] = React.useState<any>();

  React.useEffect(() => {
    setUser(getUserFromSessionStorage());
  }, []);

  const { toast } = useToast();

  // Move sessionStorage access to useEffect to ensure it only runs client-side
  React.useEffect(() => {
    if (user) {
      setUserDetails({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
      });
    }
  }, []);

  // Early return if no user is found
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="p-6">
            <p>Please log in to view your profile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageBase64 = reader.result as string;
        setSelectedImage(imageBase64);
        localStorage.setItem(`profileImage_${user.id}`, imageBase64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateUser(user.id as number, userDetails);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePassword = async () => {
    setIsLoading(true);
    try {
      await updatePassword(
        user.id as number,
        newPassword.currentPassword,
        newPassword.newPassword,
      );
      toast({
        title: "Password Updated",
        description: "Your password has been updated successfully.",
      });
      setNewPassword({ currentPassword: "", newPassword: "" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <h1 className="text-3xl font-bold">My profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>Personal info</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="space-y-4 flex-grow">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div className="relative">
                  <Avatar className="h-[200px] w-[200px]">
                    <AvatarImage
                      src={selectedImage || "/placeholder-avatar.png"}
                      alt="Profile"
                    />
                    <AvatarFallback>{`${userDetails.first_name.charAt(
                      0,
                    )}${userDetails.last_name.charAt(0)}`}</AvatarFallback>
                  </Avatar>
                  <Label
                    htmlFor="picture"
                    className="absolute bottom-0 left-0 cursor-pointer"
                  >
                    <div className="rounded-full bg-primary p-2 text-primary-foreground">
                      <Edit className="h-4 w-4" />
                    </div>
                    <Input
                      id="picture"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleImageChange}
                    />
                  </Label>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={userDetails.first_name}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={userDetails.last_name}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={userDetails.email}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={userDetails.phone}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={userDetails.address}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button variant="outline" disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              value={newPassword.currentPassword}
              onChange={(e) =>
                setNewPassword((prev) => ({
                  ...prev,
                  currentPassword: e.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              value={newPassword.newPassword}
              onChange={(e) =>
                setNewPassword((prev) => ({
                  ...prev,
                  newPassword: e.target.value,
                }))
              }
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button variant="outline" disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSavePassword} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Password
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
