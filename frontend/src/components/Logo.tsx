import Image from 'next/image';

export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      <Image src="/logo.svg" alt="CareerAssist Logo" width={40} height={40} />
      <span className="text-xl md:text-2xl xl:text-3xl font-bold text-color-accent">CareerAssist</span>
    </div>
  );
}