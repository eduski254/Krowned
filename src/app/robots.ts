import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://krowned.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/api/",
          "/auth/",
          "/login",
          "/signup",
          "/forgot-password",
          "/reset-password",
          "/confirm",
          "/account-deleted",
          "/unsubscribe",
          "/checkin/",
          "/invite/",
          "/booking/success",
          "/booking/cancelled",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
