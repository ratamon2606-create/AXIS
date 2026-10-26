/** @type {import("next").NextConfig} */
const nextConfig = {
  output: "standalone",

  experimental: {
    serverActions: {
      // กำหนดขนาด body size สูงสุดสำหรับ Server Actions (รองรับการอัปโหลดไฟล์หลายไฟล์รวมกัน)
      bodySizeLimit: "100mb",
    },
  },
};

export default nextConfig;