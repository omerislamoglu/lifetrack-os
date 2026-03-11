import React from 'react';
import * as icons from 'lucide-react';

const Icon = ({ name, ...props }) => {
  // Geçersiz veya tanımsız bir ikon adı gelirse varsayılan olarak 'Activity' ikonunu göster
  const LucideIcon = icons[name] || icons.Activity;

  if (!LucideIcon) {
    return null; // Veya başka bir yedek arayüz
  }

  return <LucideIcon {...props} />;
};

export default Icon;