import React from 'react';

export default function MapPage() {
  return (
    <div className="pt-16 min-h-screen w-full flex flex-col items-center">
      <div className="w-full flex-1 relative flex flex-col h-[calc(100vh-4rem)]">
        {/* Title Section */}
        <div className="absolute top-0 right-0 left-0 bg-gradient-to-b from-bg-base via-bg-base/80 to-transparent z-10 p-6 pointer-events-none">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <div className="w-1.5 h-10 bg-olive-500 rounded-full" />
            <div>
              <h2 className="text-3xl font-bold font-amiri text-text-primary">خريطة فلسطين التاريخية</h2>
              <p className="text-text-secondary font-cairo cursor-default">
                استكشف القرى والمناطق الفلسطينية كما كانت قبل النكبة عبر خرائط مفتوحة المصدر
              </p>
            </div>
          </div>
        </div>
        
        {/* Iframe */}
        <div className="w-full h-full bg-slate-100 flex-1 relative z-0">
          <iframe 
            src="https://palopenmaps.org/ar/maps/ramallah?basemap=pal20k1940&overlay=pal1940&color=status&toggles=places|year|split#14.00,35.1961,31.9043" 
            title="Palestine Open Maps"
            className="w-full h-[calc(100vh-4rem)] border-none"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
