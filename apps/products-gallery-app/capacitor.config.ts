import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'productsGalleryApp',
  webDir: '../../dist/apps/products-gallery-app',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
  },
};

export default config;
