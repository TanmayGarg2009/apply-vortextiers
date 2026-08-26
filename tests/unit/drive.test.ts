import { describe, it, expect } from "vitest";
import {
  categorizeMimeType,
  sanitizeFilename,
  verifyUploadSessionToken,
} from "@/lib/drive/google-drive";

describe("Google Drive Utilities", () => {
  describe("MIME type categorization", () => {
    it("should classify image MIME types as IMAGE", () => {
      expect(categorizeMimeType("image/png")).toBe("IMAGE");
      expect(categorizeMimeType("image/jpeg")).toBe("IMAGE");
      expect(categorizeMimeType("image/webp")).toBe("IMAGE");
    });

    it("should classify video MIME types as VIDEO", () => {
      expect(categorizeMimeType("video/mp4")).toBe("VIDEO");
      expect(categorizeMimeType("video/webm")).toBe("VIDEO");
      expect(categorizeMimeType("video/quicktime")).toBe("VIDEO");
    });

    it("should classify document MIME types as DOCUMENT", () => {
      expect(categorizeMimeType("application/pdf")).toBe("DOCUMENT");
      expect(categorizeMimeType("text/plain")).toBe("DOCUMENT");
    });
  });

  describe("Filename sanitization", () => {
    it("should sanitize dangerous characters and maintain extension", () => {
      const safe = sanitizeFilename("../../etc/passwd.png");
      expect(safe).not.toContain("..");
      expect(safe).not.toContain("/");
      expect(safe.endsWith(".png")).toBe(true);
    });

    it("should replace spaces and special characters with underscores", () => {
      const safe = sanitizeFilename("My Duel Highlight #1!.mp4");
      expect(safe.endsWith(".mp4")).toBe(true);
      expect(safe).not.toContain(" ");
      expect(safe).not.toContain("#");
      expect(safe).not.toContain("!");
    });
  });

  describe("Upload Session Token verification", () => {
    it("should decode mock tokens correctly", () => {
      const mockToken = Buffer.from(
        JSON.stringify({
          isMock: true,
          applicationId: "VT-123456",
          filename: "test.png",
          safeFilename: "test_abc.png",
          mimeType: "image/png",
          sizeBytes: 1024,
          category: "IMAGE",
          exp: Date.now() + 100000,
        })
      ).toString("base64url");

      const decoded = verifyUploadSessionToken(mockToken);
      expect(decoded).not.toBeNull();
      expect(decoded.applicationId).toBe("VT-123456");
      expect(decoded.isMock).toBe(true);
    });
  });
});
