// Contents of an avatar circle: the uploaded photo when there is one, otherwise
// the first letter of the name. Put it inside a circle that already has its own
// size, background and classes; it only fills it.
export default function AvatarContent({ src, name }: { src?: string | null; name: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className="h-full w-full rounded-full object-cover" referrerPolicy="no-referrer" />;
  }
  return <>{name.trim().charAt(0).toUpperCase() || 'U'}</>;
}
