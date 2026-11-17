"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Photo {
  src: string;
  alt: string;
}

/**
 * Photo gallery: a large lead photo with three thumbnails on desktop, a
 * swipeable scroll-snap strip on mobile, and a full-screen viewer (native
 * <dialog>, so focus trapping and Escape come for free).
 */
export function Gallery({ photos, title }: { photos: Photo[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const open = (i: number) => {
    setIndex(i);
    setIsOpen(true);
    dialogRef.current?.showModal();
  };
  const close = () => dialogRef.current?.close();
  const step = (delta: number) => setIndex((i) => (i + delta + photos.length) % photos.length);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % photos.length);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + photos.length) % photos.length);
    };
    dialog.addEventListener("keydown", onKey);
    return () => dialog.removeEventListener("keydown", onKey);
  }, [photos.length]);

  const tile =
    "group relative overflow-hidden bg-mist cursor-zoom-in focus-visible:outline-offset-[-3px]";

  return (
    <>
      {/* Mobile: swipeable strip */}
      <ul
        aria-label={`${title} photos`}
        className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 md:hidden"
      >
        {photos.map((photo, i) => (
          <li key={`${i}-${photo.src}`} className="w-[86%] shrink-0 snap-center">
            <button
              type="button"
              onClick={() => open(i)}
              aria-label={`Open photo ${i + 1} of ${photos.length}: ${photo.alt}`}
              className={cn(tile, "block aspect-[4/3] w-full rounded-xl")}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "auto"}
                sizes="86vw"
                className="object-cover"
              />
            </button>
          </li>
        ))}
      </ul>

      {/* Desktop: lead photo with thumbnails */}
      <div className="hidden h-[30rem] grid-cols-4 grid-rows-2 gap-3 md:grid">
        {photos.slice(0, 4).map((photo, i) => (
          <button
            key={`${i}-${photo.src}`}
            type="button"
            onClick={() => open(i)}
            aria-label={`Open photo ${i + 1} of ${photos.length}: ${photo.alt}`}
            className={cn(
              tile,
              "rounded-xl",
              i === 0 && "col-span-2 row-span-2",
              i === 1 && "col-span-2",
            )}
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : "auto"}
              sizes={i === 0 ? "(min-width: 1280px) 600px, 50vw" : "(min-width: 1280px) 600px, 50vw"}
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            />
          </button>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        onClose={() => setIsOpen(false)}
        aria-label={`${title} photo viewer`}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-ink/95 p-0 text-white backdrop:bg-ink"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-sm font-medium" aria-live="polite">
              {index + 1} / {photos.length}
            </p>
            <button
              type="button"
              onClick={close}
              aria-label="Close photo viewer"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="relative flex-1">
            {/* Only rendered while open, so the large image is not fetched up front. */}
            {isOpen && (
              <Image
                key={photos[index].src}
                src={photos[index].src}
                alt={photos[index].alt}
                fill
                sizes="100vw"
                className="object-contain"
              />
            )}
          </div>
          <div className="flex items-center justify-between gap-4 px-4 py-4">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous photo"
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:scale-95"
            >
              <ChevronLeft className="h-6 w-6" aria-hidden="true" />
            </button>
            <p className="text-center text-sm text-white/90">{photos[index].alt}</p>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next photo"
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:scale-95"
            >
              <ChevronRight className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
