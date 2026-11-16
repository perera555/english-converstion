import { ImageResponse } from "next/og";

const SIZES = ["180", "192", "512"];

export function generateStaticParams() {
  return SIZES.map((size) => ({ size }));
}

export async function GET(_req: Request, { params }: RouteContext<"/icons/[size]">) {
  const { size } = await params;
  const px = SIZES.includes(size) ? Number(size) : 192;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #d946ef 0%, #7c3aed 50%, #22d3ee 100%)",
        }}
      >
        <div
          style={{
            width: "62%",
            height: "52%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#07070f",
            borderRadius: px * 0.12,
            color: "white",
            fontSize: px * 0.3,
            fontWeight: 900,
          }}
        >
          S
        </div>
      </div>
    ),
    { width: px, height: px },
  );
}
