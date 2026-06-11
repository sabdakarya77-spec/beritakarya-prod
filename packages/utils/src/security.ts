/**
 * Anonymize IP Address by masking the last part (PDP Compliance)
 * IPv4: 1.2.3.4 -> 1.2.3.0
 * IPv6: a:b:c:d:e:f:g:h -> a:b:c:d::
 */
export function anonymizeIP(ip?: string): string | undefined {
  if (!ip) return undefined
  
  // Handle IPv4
  if (ip.includes('.')) {
    const parts = ip.split('.')
    if (parts.length >= 3) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`
    }
  }
  
  // Handle IPv6
  if (ip.includes(':')) {
    const parts = ip.split(':')
    if (parts.length >= 3) {
      return `${parts[0]}:${parts[1]}:${parts[2]}:0::`
    }
  }
  
  return ip
}
