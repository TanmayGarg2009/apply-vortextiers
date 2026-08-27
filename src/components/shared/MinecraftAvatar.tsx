import React from "react";

interface MinecraftAvatarProps {
  username?: string | null;
  size?: number;
  type?: "head" | "bust";
  className?: string;
}

export function MinecraftAvatar({
  username,
  size = 36,
  type = "head",
  className = "",
}: MinecraftAvatarProps) {
  const cleanUsername = username?.trim() || "MHF_Steve";
  const avatarUrl =
    type === "bust"
      ? `https://mc-heads.net/body/${cleanUsername}/128`
      : `https://mc-heads.net/avatar/${cleanUsername}/${size * 2}`;

  return (
    <div
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-md border border-border/80 bg-secondary/80 shadow-sm flex-shrink-0 ${className}`}
      style={type === "head" ? { width: size, height: size } : {}}
    >
      <img
        src={avatarUrl}
        alt={username ? `${username}'s skin` : "Minecraft Player"}
        className={type === "head" ? "h-full w-full object-cover image-pixelated" : "h-auto w-full object-contain image-pixelated"}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src =
            type === "bust"
              ? "https://mc-heads.net/body/MHF_Steve/128"
              : "https://mc-heads.net/avatar/MHF_Steve/64";
        }}
      />
    </div>
  );
}
