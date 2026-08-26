import React from "react";
import Image from "next/image";
import { getMinecraftHeadUrl } from "@/lib/utils";

interface MinecraftAvatarProps {
  username?: string | null;
  size?: number;
  className?: string;
}

export function MinecraftAvatar({
  username,
  size = 36,
  className = "",
}: MinecraftAvatarProps) {
  const headUrl = getMinecraftHeadUrl(username || "MHF_Steve");

  return (
    <div
      className={`relative inline-block overflow-hidden rounded-md border border-border/80 bg-secondary/80 shadow-sm ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={headUrl}
        alt={username ? `${username}'s skin` : "Minecraft Player"}
        width={size}
        height={size}
        className="image-pixelated object-cover"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src =
            "https://minotar.net/avatar/MHF_Steve/64.png";
        }}
      />
    </div>
  );
}
