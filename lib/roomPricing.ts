export function isDormitoryRoom(roomType: string) {
  const normalizedType = roomType.toLowerCase().replace(/[^a-z0-9]/g, '');
  return normalizedType.includes('dorm') || normalizedType.startsWith('doormat');
}
