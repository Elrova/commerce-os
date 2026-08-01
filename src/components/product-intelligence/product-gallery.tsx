import Image from "next/image";
import { ImageIcon } from "lucide-react";

export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  if (images.length === 0) {
    return <div className="grid aspect-[4/5] place-items-center rounded-2xl border border-dashed border-[#d8d6ce] bg-[#f1f0ea] text-center"><div><ImageIcon className="mx-auto size-7 text-[#999a93]" /><p className="mt-3 text-xs text-[#85867f]">Image non disponible</p></div></div>;
  }
  return <div><a href={images[0]} target="_blank" rel="noreferrer" className="relative block aspect-[4/5] overflow-hidden rounded-2xl border border-[#e0ded6] bg-white"><Image src={images[0]} alt={title} fill priority sizes="(max-width: 1024px) 100vw, 42vw" className="object-contain p-4 transition duration-300 hover:scale-[1.02]" /></a>{images.length > 1 && <div className="mt-3 grid grid-cols-4 gap-2">{images.slice(1, 5).map((image, index) => <a key={image} href={image} target="_blank" rel="noreferrer" className="relative aspect-square overflow-hidden rounded-xl border border-[#e0ded6] bg-white"><Image src={image} alt={`${title} — vue ${index + 2}`} fill sizes="120px" className="object-contain p-2 transition hover:scale-105" /></a>)}</div>}</div>;
}
