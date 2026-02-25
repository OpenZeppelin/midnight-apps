'use client';

import Avatar from 'boring-avatars';

export function Identicon({
  address,
  size,
}: {
  address: string;
  size: number;
}) {
  return (
    <Avatar
      size={size}
      name={address}
      variant="bauhaus"
      colors={['#9ca3af', '#d1d5db', '#1f2937', '#b0b0b0', '#e5e7eb']}
    />
  );
}
