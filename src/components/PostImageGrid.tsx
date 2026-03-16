import React from 'react';

interface PostImageGridProps {
  images: string[];
}

export function PostImageGrid({ images }: PostImageGridProps) {
  const validImages = images?.filter(img => !!img) || [];
  if (validImages.length === 0) return null;

  const count = validImages.length;

  const renderImage = (url: string, className: string, index?: number) => (
    <div key={url} className={`relative overflow-hidden rounded-lg ${className}`}>
      <img
        src={url}
        alt={`Post image ${index !== undefined ? index + 1 : ''}`}
        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
        referrerPolicy="no-referrer"
      />
      {index === 3 && count > 4 && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-2xl font-bold">
          +{count - 4}
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full mb-4">
      {count === 1 && (
        <div className="rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          <img 
            src={validImages[0]} 
            alt="Post attachment" 
            className="w-full h-auto max-h-[600px] object-contain" 
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {count === 2 && (
        <div className="grid grid-cols-2 gap-2 h-[300px] md:h-[400px]">
          {validImages.map((url) => renderImage(url, 'h-full'))}
        </div>
      )}

      {count === 3 && (
        <div className="grid grid-cols-2 gap-2 h-[300px] md:h-[400px]">
          {renderImage(validImages[0], 'h-full')}
          <div className="grid grid-rows-2 gap-2 h-full">
            {renderImage(validImages[1], 'h-full')}
            {renderImage(validImages[2], 'h-full')}
          </div>
        </div>
      )}

      {count === 4 && (
        <div className="flex flex-col gap-2">
          <div className="h-[200px] md:h-[300px]">
            {renderImage(validImages[0], 'h-full w-full')}
          </div>
          <div className="grid grid-cols-3 gap-2 h-[100px] md:h-[150px]">
            {validImages.slice(1).map((url) => renderImage(url, 'h-full'))}
          </div>
        </div>
      )}

      {count >= 5 && (
        <div className="grid grid-cols-2 gap-2 h-[300px] md:h-[400px]">
          {validImages.slice(0, 4).map((url, idx) => renderImage(url, 'h-full', idx))}
        </div>
      )}
    </div>
  );
}
