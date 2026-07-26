import { ImageResponse } from "next/og"

export const runtime = "edge"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          backgroundColor: "#0a0a0a",
        }}
      >
        <div
          style={{
            fontSize: 108,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "#818cf8",
          }}
        >
          ExamOps
        </div>
        <div style={{ fontSize: 32, color: "#a1a1aa" }}>
          Cloud, DevOps & AI certification prep
        </div>
      </div>
    ),
    { ...size }
  )
}
