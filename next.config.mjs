/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
      ignoreDuringBuilds: true,
    },
    async rewrites() {
      return [
        {
          source: "/api/:path*",
          destination: "http://alameenapp.runasp.net/api/:path*", 
       
        },
      ];
    },
  };
  
  export default nextConfig;
  