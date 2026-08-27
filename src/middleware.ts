import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Ensure security headers on non-static requests
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("X-XSS-Protection", "1; mode=block");

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.png, vx-logo.jpg, static images and icons
     * - files with extensions: svg, png, jpg, jpeg, webp, gif, ico, woff, woff2, css, js
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.png|vx-logo.jpg|icons/|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico|woff|woff2|css|js)).*)",
  ],
};
