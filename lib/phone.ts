export function normalizePhone(input: string): string {
  let p = input.replace(/[\s-]/g, "");
  if (p.startsWith("+88")) p = p.slice(3);
  else if (p.startsWith("88") && p.length === 13) p = p.slice(2);
  return p;
}
export function isValidPhone(phone: string): boolean {
  return /^01[3-9]\d{8}$/.test(phone);
}
