import Image from 'next/image';
export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      <Image src="/logo.svg" alt="CareerAssist Logo" width={40} height={40} />
      <span className="text-xl font-bold text-primary">CareerAssist</span>
    </div>
  );
}