/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
      ignoreDuringBuilds: true,
    },
    async rewrites() {
      return [
        {
          source: "/media/:path*",
          destination: "http://alameenapp.runasp.net/AppMedia/:path*", 
        },
        {
          source: "/api/:path*",
          destination: "http://alameenapp.runasp.net/api/:path*", 
       
        },
      ];
    },
  };
  
  export default nextConfig;
  