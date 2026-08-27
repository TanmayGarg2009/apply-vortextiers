"use client";

import React, { useState } from "react";

interface MinecraftAvatarProps {
  username?: string | null;
  size?: number;
  type?: "head" | "bust" | "body";
  className?: string;
}

export function MinecraftAvatar({
  username,
  size = 40,
  type = "head",
  className = "",
}: MinecraftAvatarProps) {
  const cleanUsername = username?.trim() || "MHF_Steve";
  const [hasError, setHasError] = useState(false);

  const getUrl = () => {
    if (hasError) {
      return type === "body" || type === "bust"
        ? "https://mc-heads.net/body/MHF_Steve/200"
        : `https://mc-heads.net/avatar/MHF_Steve/${size * 2}`;
    }
    if (type === "body" || type === "bust") {
      return `https://mc-heads.net/body/${cleanUsername}/200`;
    }
    return `https://mc-heads.net/avatar/${cleanUsername}/${size * 2}`;
  };

  if (type === "body" || type === "bust") {
    return (
      <div className={`relative flex items-center justify-center flex-shrink-0 ${className}`}>
        <img
          src={getUrl()}
          alt={username ? `${username}'s skin` : "Minecraft Player"}
          className="h-full w-auto max-h-[160px] object-contain drop-shadow-md image-pixelated"
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-lg border border-border/80 bg-secondary/80 shadow-sm flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={getUrl()}
        alt={username ? `${username}'s head` : "Minecraft Player"}
        className="h-full w-full object-cover image-pixelated"
        onError={() => setHasError(true)}
      />
    </div>
  );
}
