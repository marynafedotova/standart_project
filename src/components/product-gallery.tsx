"use client";

import Image from "next/image";
import { useState } from "react";

export function ProductGallery({
  images,
  name
}: {
  images: string[];
  name: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const safeImages = images.length > 0 ? images : [];
  const activeImage = safeImages[activeIndex] ?? safeImages[0];

  function showPrev() {
    setActiveIndex((current) => (current === 0 ? safeImages.length - 1 : current - 1));
  }

  function showNext() {
    setActiveIndex((current) => (current === safeImages.length - 1 ? 0 : current + 1));
  }

  if (!activeImage) {
    return null;
  }

  return (
    <>
      <div className="imageCard productGalleryShell">
        <button type="button" className="galleryMainButton" onClick={() => setIsZoomOpen(true)}>
          <Image src={activeImage} alt={name} width={900} height={900} className="contentImage" />
        </button>

        {safeImages.length > 1 ? (
          <>
            <div className="galleryNav">
              <button type="button" className="galleryArrow" onClick={showPrev} aria-label="Предыдущее изображение">
                &lt;
              </button>
              <button type="button" className="galleryArrow" onClick={showNext} aria-label="Следующее изображение">
                &gt;
              </button>
            </div>
            <div className="productGalleryThumbs">
              {safeImages.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  className={`galleryThumbButton${index === activeIndex ? " active" : ""}`}
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Открыть изображение ${index + 1}`}
                >
                  <Image src={image} alt={`${name} ${index + 1}`} width={120} height={120} className="galleryThumb" />
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>

      {isZoomOpen ? (
        <div className="galleryLightbox" role="dialog" aria-modal="true">
          <button type="button" className="galleryBackdrop" onClick={() => setIsZoomOpen(false)} aria-label="Закрыть просмотр" />
          <div className="galleryLightboxInner">
            <button type="button" className="galleryClose" onClick={() => setIsZoomOpen(false)} aria-label="Закрыть">
              x
            </button>
            {safeImages.length > 1 ? (
              <button type="button" className="galleryArrow lightbox" onClick={showPrev} aria-label="Предыдущее изображение">
                &lt;
              </button>
            ) : null}
            <div className="galleryZoomFrame">
              <Image src={activeImage} alt={name} width={1400} height={1400} className="galleryZoomImage" />
            </div>
            {safeImages.length > 1 ? (
              <button type="button" className="galleryArrow lightbox" onClick={showNext} aria-label="Следующее изображение">
                &gt;
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
