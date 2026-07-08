"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BadgeCheckIcon, BellIcon, LanguagesIcon, LogOutIcon } from "lucide-react"
import { useNavigate } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { authService, type AppLanguage } from "@/services"
import { useAuthStore } from "@/stores/auth-store"
import { useCurrentUser } from "@/components/layout/current-user"

export function NavUser() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { name, email, initials } = useCurrentUser()
  const currentLanguage: AppLanguage = i18n.language?.startsWith("es")
    ? "es"
    : "en"

  async function handleLogout() {
    try {
      await authService.signOut()
      useAuthStore.getState().clear()
      navigate({ to: "/" })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("common.somethingWentWrong")
      )
    }
  }

  // Switch language instantly, persist to the DB, and update the cached profile.
  function handleLanguageChange(value: string) {
    const lang = value as AppLanguage
    if (lang === currentLanguage) return
    void i18n.changeLanguage(lang)
    authService
      .setPreferredLanguage(lang)
      .then(() => {
        const profile = useAuthStore.getState().profile
        if (profile) {
          useAuthStore.getState().setProfile({
            ...profile,
            preferred_language: lang,
          })
        }
      })
      .catch((error) => {
        toast.error(
          error instanceof Error ? error.message : t("common.somethingWentWrong")
        )
      })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="size-9 rounded-lg p-0 data-[state=open]:bg-accent"
        >
          {/* <span className="hidden truncate text-sm font-medium sm:inline">
            {name}
          </span> */}
          <Avatar className="size-full rounded-lg after:rounded-lg">
            <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-56 rounded-lg"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{name}</span>
              <span className="truncate text-xs">{email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <BadgeCheckIcon />
            {t("account.account")}
          </DropdownMenuItem>
          <DropdownMenuItem>
            <BellIcon />
            {t("account.notifications")}
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <LanguagesIcon />
              {t("account.language")}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={currentLanguage}
                onValueChange={handleLanguageChange}
              >
                <DropdownMenuRadioItem value="en">
                  {t("account.english")}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="es">
                  {t("account.spanish")}
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOutIcon />
          {t("account.logOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
